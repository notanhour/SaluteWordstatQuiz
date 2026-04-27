import argparse
import inspect
import json
import os
import random
import sys
import time

from pytrends.exceptions import TooManyRequestsError
from pytrends.request import TrendReq

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
DEFAULT_SOURCE = os.path.join(ROOT_DIR, 'src', 'data', 'wordstat.json')
DEFAULT_OUTPUT = DEFAULT_SOURCE
DEFAULT_TIMEFRAME = 'all'


def patch_pytrends_urllib3_retry():
    try:
        import urllib3.util.retry as retry
        import pytrends.request as pytrends_request
    except Exception:
        return

    retry_init = inspect.signature(retry.Retry).parameters
    if 'method_whitelist' in retry_init:
        return

    class RetryWithMethodWhitelist(retry.Retry):
        def __init__(self, *args, method_whitelist=None, allowed_methods=None, **kwargs):
            if method_whitelist is not None and allowed_methods is None:
                allowed_methods = frozenset(method_whitelist)
            super().__init__(*args, allowed_methods=allowed_methods, **kwargs)

    pytrends_request.Retry = RetryWithMethodWhitelist


patch_pytrends_urllib3_retry()


def load_json(path):
    with open(path, 'r', encoding='utf-8') as stream:
        return json.load(stream)


def save_json(path, data):
    with open(path, 'w', encoding='utf-8') as stream:
        json.dump(data, stream, ensure_ascii=False, indent=2)


def normalize_keyword(keyword):
    return keyword.strip()


def get_interest_scores(pytrends, keywords, geo, timeframe, retries=5):
    normalized = [normalize_keyword(k) for k in keywords]
    for attempt in range(1, retries + 1):
        try:
            print(f'    попытка {attempt}/{retries}: запрашиваю тренды для {normalized} (timeframe={timeframe})', flush=True)
            pytrends.build_payload(normalized, timeframe=timeframe, geo=geo, cat=0)
            df = pytrends.interest_over_time()
            print(f'    ответ получен: строки={len(df)}', flush=True)
            if df.empty:
                raise RuntimeError('Pytrends вернул пустой DataFrame')

            scores = {}
            for kw in normalized:
                if kw in df.columns:
                    # Google Trends выдаёт относительный индекс за период.
                    # Суммируем его по всем точкам времени для оценки общего интереса.
                    total = float(df[kw].sum())
                    scores[kw] = max(1, int(round(total)))
                else:
                    scores[kw] = 1

            return scores
        except TooManyRequestsError as error:
            delay = min(60, 2 ** attempt + random.uniform(1, 4))
            print(f'Попытка {attempt} не удалась (429 Too Many Requests). Жду {delay:.1f} сек и повторяю...', file=sys.stderr)
            if attempt < retries:
                time.sleep(delay)
                continue
            raise
        except Exception as error:
            delay = min(30, 2 ** attempt)
            print(f'Попытка {attempt} не удалась: {error}. Жду {delay:.1f} сек и повторяю...', file=sys.stderr)
            if attempt < retries:
                time.sleep(delay)
                continue
            raise


def create_pytrends(hl='ru-RU', tz=180, timeout=(10, 30), headers=None, retries=10, backoff_factor=5, init_retries=5):
    headers = headers or {}
    # ✅ FIX: timeout убран отсюда — он передаётся отдельно в TrendReq,
    # который сам добавит его в requests_args при инициализации
    request_args = {
        'headers': {
            'accept-language': hl,
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'referer': 'https://trends.google.com/trends/?geo=RU',
            'cache-control': 'no-cache',
            'pragma': 'no-cache',
            **headers,
        },
        # 'timeout': timeout,  ← УДАЛЕНО: чтобы избежать дублирования аргумента
    }

    for attempt in range(1, init_retries + 1):
        try:
            return TrendReq(
                hl=hl,
                tz=tz,
                timeout=timeout,  # ← timeout передаётся здесь
                retries=retries,
                backoff_factor=backoff_factor,
                requests_args=request_args,
            )
        except TooManyRequestsError as error:
            delay = min(60, 2 ** attempt + random.uniform(1, 4))
            print(f'Инициализация TrendReq не удалась (429). Жду {delay:.1f} сек...', file=sys.stderr)
            if attempt < init_retries:
                time.sleep(delay)
                continue
            raise
        except Exception as error:
            delay = min(30, 2 ** attempt)
            print(f'Инициализация TrendReq не удалась: {error}. Жду {delay:.1f} сек...', file=sys.stderr)
            if attempt < init_retries:
                time.sleep(delay)
                continue
            raise


def update_data(source_data, geo, timeframe, sleep_seconds):
    print(f'Начинаю парсинг: регион={geo}, timeframe={timeframe}, delay={sleep_seconds}s', flush=True)
    pytrends = create_pytrends(
        hl='ru-RU',
        tz=180,
        timeout=(10, 30),
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 '
            '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        },
        retries=10,
        backoff_factor=5,
        init_retries=5,
    )
    output_data = {'categories': []}

    total_categories = len(source_data.get('categories', []))
    for category_index, category in enumerate(source_data.get('categories', []), start=1):
        updated_pairs = []
        category_title = category.get('title', 'без названия')
        pairs = category.get('pairs', [])
        print(f'Категория {category_index}/{total_categories}: {category_title} ({len(pairs)} пар)', flush=True)

        for pair_index, pair in enumerate(pairs, start=1):
            left = pair.get('left')
            right = pair.get('right')
            if not left or not right:
                print(f'  {pair_index}/{len(pairs)}: пропуск пары, нет ключей', flush=True)
                updated_pairs.append(pair)
                continue

            print(f'  {pair_index}/{len(pairs)}: {left} vs {right}', flush=True)
            scores = get_interest_scores(pytrends, [left, right], geo, timeframe)
            left_count = scores.get(normalize_keyword(left), pair.get('left_count', 1))
            right_count = scores.get(normalize_keyword(right), pair.get('right_count', 1))
            print(f'    результат: {left}={left_count}, {right}={right_count}', flush=True)

            updated_pairs.append({
                'left': left,
                'left_count': left_count,
                'right': right,
                'right_count': right_count,
            })
            if sleep_seconds > 0:
                print(f'    сплю {sleep_seconds} сек...', flush=True)
                time.sleep(sleep_seconds)

        output_data['categories'].append({
            'id': category.get('id'),
            'title': category.get('title'),
            'pairs': updated_pairs,
        })
        print(f'Категория {category_index}/{total_categories} обработана.', flush=True)

    return output_data


def main():
    parser = argparse.ArgumentParser(description='Обновить wordstat.json на основе Pytrends.')
    parser.add_argument('--source', default=DEFAULT_SOURCE, help='Путь к исходному JSON-шаблону')
    parser.add_argument('--output', default=DEFAULT_OUTPUT, help='Путь для записи результата')
    parser.add_argument('--geo', default='RU', help='Код региона Google Trends')
    parser.add_argument('--timeframe', default=DEFAULT_TIMEFRAME,
                        help='Промежуток времени для трендов: all, today 12-m, today 3-m, today 90-d и т.д. По умолчанию all.')
    parser.add_argument('--sleep', type=float, default=10.0, help='Задержка между запросами, секунды')
    args = parser.parse_args()

    source_path = os.path.abspath(args.source)
    output_path = os.path.abspath(args.output)

    if not os.path.exists(source_path):
        print(f'Исходный файл не найден: {source_path}', file=sys.stderr)
        sys.exit(1)

    data = load_json(source_path)
    updated_data = update_data(data, args.geo, args.timeframe, args.sleep)
    save_json(output_path, updated_data)
    print(f'Данные успешно сохранены в {output_path}')


if __name__ == '__main__':
    main()