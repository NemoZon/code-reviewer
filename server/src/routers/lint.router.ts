// @ts-nocheck
import { Router, Request, Response } from "express";
import multer from "multer";
import axios from "axios";

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Промпт для ts/react
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
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High>",
            "location": "<line_number>",
            "description": "<description>",
            "suggestion": "<suggested_fix>"
        }
    ]
}
If in the suggestion or description will be code you have to append \`\`\`languageOfCode and than code.`;

// Промпт для питона
const promptForPython = `You will be provided with a Python file along with its project path. Your task is to review the file and ensure compliance with the following project standards. Highlight critical violations that may affect stability, performance, or maintainability. Exclude minor formatting issues unless they cause functional errors or reduced clarity.

Guidelines to Follow:

Architecture and Structure:

Verify adherence to the Hexagonal architecture (separation of business logic, adapters, and composites).
Confirm appropriate placement of the file (e.g., components/demo_project_backend).
Check that dependencies and configurations (e.g., setup.py, pyproject.toml) align with project expectations.
Code Quality:

Ensure PEP 8 compliance and proper use of yapf/isort formatting.
Verify clear and concise docstrings (PEP 256/257).
Check for logical code structure, modularity, and adherence to the "Unit of Work" pattern for database transactions.
Library Usage:

Confirm use of approved libraries (e.g., Falcon, SQLAlchemy, Pydantic).
Validate compatibility with Python 3.7 and dependencies specified in the document.
Business Logic:

Check that the service layer implements DI and encapsulates logic correctly.
Ensure data transfer objects (DTOs) are used where applicable and avoid direct use of simple dictionaries between layers.
Security and Performance:

Verify that logging (via logging module) and JSON serialization meet project standards.
Ensure database queries avoid N+1 issues and follow specified ORM mapping patterns.
Testing and Error Handling:

Confirm presence of unit and integration tests, with correct mocking of adapters for unit tests.
Check that errors are handled gracefully, avoiding technical details in user-facing responses.
Output Format:

Return findings in JSON format:
{
    "file": "<file_name>",
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High>",
            "location": "<line_number>",
            "description": "<description>",
            "suggestion": "<suggested_fix>"
        }
    ]
}
If there are no critical issues, return an empty JSON object.`

// Промпт для шарпов
const promptForCs = `You will be provided with a C# file along with its project path. Your task is to review the file and ensure compliance with the project’s coding standards and best practices. Focus on critical issues that may impact functionality, maintainability, or performance. Exclude trivial style issues unless they directly affect code clarity or execution.

Guidelines to Follow:

Project and Dependencies:

Ensure all NuGet packages are updated to their latest secure versions.
Verify there are no redundant dependencies or absolute paths in references.
Check for compliance with OpenShift or WPF guidelines if applicable.
Code Quality:

Ensure no unresolved TODO comments, unused code, or obsolete elements.
Verify presence of meaningful comments for models and entities.
Check for unused variables or return values.
Architecture and Method Design:

Validate correct IoC container registrations (e.g., HostedService as Singleton).
Confirm null checks and exception handling are implemented at the correct level.
Verify methods return appropriate types (e.g., avoid null collections).
LINQ and Collections:

Avoid redundant operations like ToArray() or ToList() where unnecessary.
Ensure Chunk() is used instead of Skip().Take() where applicable.
Check methods like Union() or Distinct() are used with proper overrides for Equals() and GetHashCode().
Entity Framework:

Use asynchronous materialization (ToListAsync()) where possible.
Avoid redundant SaveChangesAsync() calls after individual actions.
Ensure filtering is done at the database level, not in application code.
Logging and Error Handling:

Prevent duplicate exception messages in logs.
Use proper logging syntax to avoid unnecessary string formatting overhead.
Output Format:

Return findings in JSON format:

json
Копировать код
{
    "file": "<file_name>",
    "issues": [
        {
            "type": "<issue_type>",
            "criticality": "<Critical/High>",
            "location": "<line_number>",
            "description": "<description>",
            "suggestion": "<suggested_fix>"
        }
    ]
}
If there are no critical issues, return an empty JSON object.`


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
  let promptForCurrentLanguage = null;
  if (filePath.endsWith('.py')) {
    promptForCurrentLanguage = promptForPython;
  } else if (filePath.endsWith('.cs')) {
    promptForCurrentLanguage = promptForCs;
  } else {
    promptForCurrentLanguage = prompt;
  }
  

  try {
    const llmResult = await sendToLLM(fileContent, filePath, promptForCurrentLanguage + `\nFilePath: ${filePath}`, true);
    res.json({ llmResponse: llmResult });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export const LintRouter = router;
