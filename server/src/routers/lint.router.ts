// @ts-nocheck
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Статический пропмт
const prompt = `You will be provided with a TypeScript/React file along with its project path. Your task is to perform a code review to check if the file adheres to the project's standards. Focus on important remarks and emphasize any critical violations that may affect the stability or quality of the project.

Please note that variable naming conventions are less important and can be excluded from your analysis.

Guidelines to follow:

Project and Component Structure:

Ensure the file is located in the correct directory based on its functionality:
Components for UI components.
Containers for components that bind data to the UI.
Pages for page components.
Verify that the component's folder structure follows the standard format:
<ComponentName>/
  index.ts
  <ComponentName>.tsx
  <ComponentName>.module.css
  types.ts
  utils.ts
Confirm the use of CSS Modules for styling, with class names in snake_case.
Functions:

Check that regular functions are used instead of arrow functions (function funcName instead of funcName = () => {}), except for short callback expressions - it's an important rule.
Ensure that arrow functions are not used as methods within objects.
Documentation Quality:

Verify that each name and comment in the code clearly explains its functionality.
Ensure that interfaces for component props are developed with mandatory attributes className and style.
Coding Standards Compliance:

Confirm that the code is formatted according to ESLint and Prettier configurations.
Ensure there is no duplicated or unused code.
Use of Methods and Libraries:

Verify the use of recommended libraries and approaches, such as using Effector for state management.
Check the correctness of API requests.
Security and Performance:

Ensure the code meets requirements for security, performance, and scalability.
Utilize static analysis tools to identify any vulnerabilities or errors.
Critical Remarks:

Highlight any critical violations of standards that could impact the project's stability or quality.
Output:

Provide a detailed report summarizing your findings, focusing on critical issues. Exclude comments on variable naming conventions unless they directly affect the code's functionality or clarity.
If nothing critical in this code than you can send empty JSON.

### Report Format:
Return your findings in JSON format:
{
    "file": "<file_name>",
    "score": <final_score>,
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High>",
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
1. Arrow functions (e.g. => {}) are allowed only for simple expressions. If using braces, rewrite as a classic function.
2. Arrow functions (e.g. => {}) must not be used for object methods.
3. Classic functions are preferred and should be used wherever possible.

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
const sendToLLM = async (fileContent: string, filePath: string, prompt: string, needToReturn?: boolean) => {
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
    return await sendToLLM(fileContent, filename, prompt + `\nFilePath: ${filePath}`, true);
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
  const filePath = req.body.path;

  try {
    const llmResult = await sendToLLM(fileContent, filePath, prompt + `\nFilePath: ${filePath}`, true);
    res.json({ llmResponse: llmResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const LintRouter = router;
