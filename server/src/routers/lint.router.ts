// @ts-nocheck
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Статический пропмт
const prompt = "Проверь данный файл на соответствие архитектурным стандартам. ОТВЕТ ПРИНИМАЕТСЯ ТОЛЬКО НА ВЕЛИКОМ И МОГУЧЕМ РУССКОМ ЯЗЫКЕ.";

// Функция для отправки запроса в LLM
const sendToLLM = async (fileContent: string, prompt: string) => {
  const url = "http://84.201.152.196:8020/v1/completions";  // Замените на ваш URL LLM

  const headers = {
    'Authorization': 'leQ0NieMkgtPvzC0lZu5iGy8mXiTec7B',  // Замените на ваш токен
    'Content-Type': 'application/json',
  };

  const data = {
    model: 'mistral-nemo-instruct-2407',  // Замените на используемую модель
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: fileContent }
    ],
    max_tokens: 1000,
    temperature: 0.3,
  };

  try {
    const response = await axios.post(url, data, { headers });
    return response.data;  // Возвращаем ответ от LLM
  } catch (error) {
    console.error("Ошибка при обращении к LLM:", error);
    throw new Error("Ошибка при обработке файла LLM");
  }
};

router.post("/lint", upload.single("file"), async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: "Файл не предоставлен" });
  }

  const fileContent = req.file.buffer.toString("utf-8");

  try {
    const llmResult = await sendToLLM(fileContent, prompt);
    res.json({ llmResponse: llmResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const LintRouter = router;
