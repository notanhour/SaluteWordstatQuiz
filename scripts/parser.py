import json
import random
import time
from pytrends.request import TrendReq
from pytrends.exceptions import TooManyRequestsError

def start_parsing(n: int = 25):
    # Настройка маскировки под браузер
    user_agent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
    
    pytrends = TrendReq(
        hl='ru-RU', 
        tz=180, 
        timeout=(10, 25),
        requests_args={'headers': {'User-Agent': user_agent}}
    )

    # Загрузка исходных данных нового формата
    try:
        with open('src/data/categories.json', 'r', encoding='utf-8') as f:
            source_data = json.load(f)
    except FileNotFoundError:
        print("Ошибка: Файл categories.json не найден!")
        return

    output_data = {"categories": []}

    # Итерируемся по списку категорий из исходного файла
    for cat in source_data.get("categories", []):
        category_id = cat.get("id")
        category_title = cat.get("title")
        words_list = cat.get("words", [])
        
        current_category = {
            "id": category_id,
            "title": category_title,
            "pairs": []
        }
        
        print(f"\nКатегория: {category_title} (ID: {category_id})")
        
        pairs_collected = 0
        while pairs_collected < n:
            if len(words_list) < 2:
                print(f"  [!] Недостаточно слов в категории {category_title} для генерации пар.")
                break
            
            # Выбираем 2 случайных слова
            words = random.sample(words_list, 2)
            
            try:
                # Запрос статистики
                pytrends.build_payload(words, timeframe='today 12-m', geo='RU')
                df = pytrends.interest_over_time()

                if not df.empty and words[0] in df.columns:
                    # Считаем среднее
                    mean1 = df[words[0]].mean()
                    mean2 = df[words[1]].mean()
                    
                    total = mean1 + mean2
                    if total > 0:
                        # Округляем до целых
                        p1 = int(round((mean1 / total) * 100))
                        p2 = 100 - p1
                    else:
                        p1, p2 = 50, 50

                    current_category["pairs"].append({
                        "left": words[0],
                        "left_percent": p1,
                        "right": words[1],
                        "right_percent": p2
                    })
                    
                    pairs_collected += 1
                    print(f"  [{pairs_collected}/25] {words[0]} ({p1}%) vs {words[1]} ({p2}%)")
                    
                    # Случайная пауза
                    time.sleep(random.uniform(3.0, 5.5))
                else:
                    # Если данных нет, едем дальше
                    continue

            except TooManyRequestsError:
                wait_time = random.randint(60, 100)
                print(f"\n  [!] Блокировка (429). Спим {wait_time} сек...")
                time.sleep(wait_time)
            except Exception as e:
                print(f"  [!] Ошибка: {e}. Спим 10 сек...")
                time.sleep(10)
        
        output_data["categories"].append(current_category)

    # Сохранение итогового файла wordstat.json
    with open('src/data/wordstat.json', 'w', encoding='utf-8') as f:
        json.dump(output_data, f, ensure_ascii=False, indent=4)
    
    print("Победа! Файл wordstat.json готов.")

if __name__ == "__main__":
    start_parsing()