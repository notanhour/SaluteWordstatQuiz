const fs = require('fs');
const path = require('path');

const outputPath = path.resolve(__dirname, '../src/data/wordstat.json');
const token = process.env.YANDEX_WORDSTAT_TOKEN;
const apiHost = process.env.YANDEX_WORDSTAT_API_URL || 'https://api.wordstat.yandex.net/v1';

if (!token) {
  console.error('Ошибка: требуется токен YANDEX_WORDSTAT_TOKEN. Установите его перед запуском.');
  process.exit(1);
}

async function fetchWordstatData() {
  // Пример запроса. Точный эндпоинт и формат зависят от API Яндекс.Вордстат.
  const url = `${apiHost}/batch`; // замените на реальный путь

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Ошибка запроса: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function buildStaticData(apiData) {
  // Здесь преобразуйте данные API в структуру, понятную приложению.
  return {
    categories: apiData.categories || [],
  };
}

async function main() {
  try {
    console.log('Запуск парсинга Яндекс.Вордстат...');
    const apiData = await fetchWordstatData();
    const result = buildStaticData(apiData);
    fs.writeFileSync(outputPath, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Данные успешно записаны в ${outputPath}`);
  } catch (error) {
    console.error('Ошибка при парсинге Wordstat:', error.message);
    process.exit(1);
  }
}

main();
