// @ts-nocheck
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Статический пропмт
const prompt = `You are a TypeScript code reviewer. Analyze the provided code snippet for compliance with the following standards:

### Function Standards:
1. Arrow functions are allowed only for simple expressions. If using braces, rewrite as a classic function.
2. Arrow functions must not be used for object methods.
3. Classic functions are preferred and should be used wherever possible.

### Naming Standards:
- PascalCase for components and types.
- camelCase for variables and functions.
- snake_case for CSS selectors.
- UPPER_SNAKE_CASE for constants.

### Structure and Style:
1. Ensure project structure follows the required conventions (e.g., 'index.ts' only for exports).
2. CSS Modules must be used with snake_case selectors.
3. Functions and variables should have meaningful names that reflect their purpose.

### Report Format:
Return your findings in JSON format:
{
    "file": "<file_name>",
    "score": <final_score>,
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High/Medium/Low>",
            "location": "<line_number>",
            "description": "<description>",
            "suggestion": "<suggested_fix>"
        }
    ]
}`;

const getPropmt = (filename: string, withHistory: boolean, response: boolean) => {
    const firstPart = `You are a TypeScript code reviewer. Analyze the provided ${filename} for compliance with the following standards:`
    const firstPartToExplain = `You previously provided the following report for the file ${filename} like a TypeScript expert. Now you should correct inaccuracies of this report and send corrected report with same structure.`;

    const rules = `
    ### Function Standards:
1. Arrow functions are allowed only for simple expressions. If using braces, rewrite as a classic function.
2. Arrow functions must not be used for object methods.
3. Classic functions are preferred and should be used wherever possible.

### Naming Standards:
- PascalCase for components and types.
- camelCase for variables and functions.
- snake_case for CSS selectors.
- UPPER_SNAKE_CASE for constants.

### Structure and Style:
1. Ensure project structure follows the required conventions (e.g., 'index.ts' only for exports).
2. CSS Modules must be used with snake_case selectors.
3. Functions and variables should have meaningful names that reflect their purpose.`
    const formatForTest = `
    ### Report Format:
Return ONLY corrected file and nothing more`;
    const format = `
    ### Report Format:
Return your findings in JSON format:
{
    "file": "<file_name>",
    "score": <final_score>,
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High/Medium/Low>",
            "location": "<line_number>",
            "description": "<description>",
            "suggestion": "<suggested_fix>"
        }
    ]
}`;

    if (!withHistory) {
        return firstPart + rules + format;
    }
    return firstPartToExplain + rules + `
    Previous report:
    ` + response + `
    ` + format;
}

// Функция для отправки запроса в LLM
const sendToLLM = async (fileContent: string, filename: string, prompt: string, needToReturn?: boolean) => {
  const url = "http://84.201.152.196:8020/v1/completions";

  const headers = {
    'Authorization': 'leQ0NieMkgtPvzC0lZu5iGy8mXiTec7B',
    'Content-Type': 'application/json',
  };

  const data = {
    model: 'mistral-nemo-instruct-2407',
    messages: [
      { role: 'system', content: prompt },
      { role: 'user', content: fileContent }
    ],
    max_tokens: 1000,
    temperature: 0.1,
  };

  try {
    const response = await axios.post(url, data, { headers });
    if (needToReturn) {
        return response.data;
    }
    console.log(needToReturn);
    console.log(response.data.choices[0].message.content);
    return await sendToLLM(fileContent, filename, getPropmt(filename, true, response.data), true);
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
    const llmResult = await sendToLLM(fileContent, req.file.filename, getPropmt(req.file.filename, false, null), true);
    res.json({ llmResponse: llmResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const LintRouter = router;
