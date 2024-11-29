import dotenv from 'dotenv';
import app from './app';
import axios, { AxiosError } from 'axios';
dotenv.config();

const port = process.env.PORT || 3000;

const API_KEY = process.env.EVRAZ_API_KEY;
const BASE_URL = process.env.BASE_URL;

// Функция для запроса к модели
async function queryLLM() {
  const model = 'mistral-nemo-instruct-2407'; // Укажите модель
  const messages = [
    { role: 'system', content: 'отвечай на ВЕЛИКОМ РУССКОМ ЯЗЫКЕ' },
    { role: 'user', content: '2 + 2 = ?' },
  ];

  try {
    const response = await axios.post(
      `${BASE_URL}/completions`,
      {
        model,
        messages,
        max_tokens: 1000,
        temperature: 0.3,
      },
      {
        headers: {
          Authorization: API_KEY,
          'Content-Type': 'application/json',
        },
      }
    );

    // console.log('Ответ от модели:', response.data);
    console.log('Second answer:', response.data.choices[0].message)


  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(
        'Ошибка при запросе к модели:',
        error.response?.data || error.message
      );
    } else {
      console.error('Неизвестная ошибка:', error);
    }
  }
}

// Маршрут для тестирования
app.get('/test', async (req, res) => {
  await queryLLM();
  res.send('Запрос отправлен. Результат смотрите в консоли.');
});

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
