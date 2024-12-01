import React, { useEffect, useState } from 'react';
import { Button, Tree, Layout, Spin } from 'antd';
import { WarningOutlined, CheckOutlined } from '@ant-design/icons';
import { uid } from 'uid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip'; // Импорт JSZip
import Link from '../../../shared/links/ui/Link';
import { useStore } from '../../store/model/StoreContext';
import { FileNode } from '../model/types';
import { Json } from '../../converter/model/types';
const { Content, Sider } = Layout;

export const FileTreePage: React.FC = () => {
  const [selectedFileIssues, setSelectedFileIssues] = useState<any[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [filePdfData, setFilePdfData] = useState<Json[]>([]);

  const { store, setStore } = useStore();

  const [selectedFileContent, setSelectedFileContent] = useState<string>();

  useEffect(() => {
    if (store.lastFile?.file) {
      setSelectedFileName(store.lastFile.file.title);
      setSelectedFileContent(store.lastFile.file.content);
    }
    if (store.lastFile?.response) {
      setSelectedFileIssues(store.lastFile.response);
    }
  }, []);

  const [fileResponses, setFileResponses] = useState<{ [key: string]: any }>({});
  const [fileLoadingStatus, setFileLoadingStatus] = useState<{
    [key: string]: boolean;
  }>({});
  const [allRequestsCompleted, setAllRequestsCompleted] = useState(false);

  const setTreeData = (state: FileNode[]) => {
    setStore((prev) => ({
      ...prev,
      repoTree: state,
    }));
  };

  // Обработка выбора папки
  const handleSelectFolder = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      const files = await traverseDirectory(directoryHandle);
      setTreeData(files);

      // Собираем все ts, tsx и py файлы и отправляем их на сервер с ограничением по количеству запросов
      const tsFiles = collectTsFiles(files);

      // Отправляем файлы с ограничением на количество одновременно выполняемых запросов
      await sendFilesWithLimit(tsFiles, 5);

      setAllRequestsCompleted(true);
    } catch (error) {
      console.error('Ошибка при выборе папки:', error);
    }
  };

  // Функция для отправки файлов с ограничением на количество одновременных запросов
  const sendFilesWithLimit = async (files: FileNode[], limit: number) => {
    let index = 0;
    let activeRequests = 0;

    return new Promise<void>((resolve, reject) => {
      const next = () => {
        while (activeRequests < limit && index < files.length) {
          const file = files[index++];
          activeRequests++;

          sendFileToServer(file)
            .catch((error) => {
              console.error(`Ошибка при отправке файла ${file.title}:`, error);
            })
            .finally(() => {
              activeRequests--;
              if (index === files.length && activeRequests === 0) {
                resolve();
              } else {
                next();
              }
            });
        }
      };
      next();
    });
  };

  // Рекурсивное чтение директорий
  const traverseDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
    currentPath: string = '',
  ): Promise<FileNode[]> => {
    const children: FileNode[] = [];

    for await (const entry of directoryHandle.values()) {
      const entryPath = `${currentPath}/${entry.name}`; // Формируем путь

      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const content = await file.text();
        const fileKey = uid();

        // Если это ZIP файл, распаковываем его
        if (file.name.endsWith('.zip')) {
          await handleZipFile(file);
        } else {
          children.push({
            title: file.name,
            key: fileKey,
            isFile: true,
            content,
            path: entryPath, // Добавляем путь
          });
        }
      } else if (entry.kind === 'directory') {
        const subChildren = await traverseDirectory(entry, entryPath); // Передаем обновленный путь
        const dirKey = uid();

        if (entry.name !== 'node_modules') {
          children.push({
            title: entry.name,
            key: dirKey,
            children: subChildren,
            isFile: false,
            path: entryPath, // Добавляем путь для директории
          });
        }
      }
    }

    return children;
  };

  // Функция для обработки ZIP файлов
  const handleZipFile = async (file: File) => {
    const zip = new JSZip();
    const content = await file.arrayBuffer();
    const zipContent = await zip.loadAsync(content);

    const fileNodes: FileNode[] = [];

    await Promise.all(
      Object.keys(zipContent.files).map(async (fileName) => {
        const zipEntry = zipContent.files[fileName];
        if (!zipEntry.dir) {
          const fileData = await zipEntry.async('text');
          const fileKey = uid();
          const fileNode: FileNode = {
            title: fileName,
            key: fileKey,
            isFile: true,
            content: fileData,
            path: fileName,
          };
          fileNodes.push(fileNode);
        }
      }),
    );

    // Создаем узел для zip-файла
    const zipFileNode: FileNode = {
      title: file.name,
      key: uid(),
      isFile: false,
      path: file.name,
      children: fileNodes,
    };

    // Обновляем состояние дерева с добавленными файлами
    setStore((prev) => ({
      ...prev,
      repoTree: [...prev.repoTree, zipFileNode],
    }));

    // Собираем файлы с необходимыми расширениями из zip
    const tsFiles = collectTsFiles([zipFileNode]);

    // Отправляем файлы на сервер с ограничением по количеству запросов
    await sendFilesWithLimit(tsFiles, 5);
  };

  // Собираем все ts, tsx и py файлы из дерева
  const collectTsFiles = (nodes: FileNode[]): FileNode[] => {
    let files: FileNode[] = [];
    for (const node of nodes) {
      if (
        node.isFile &&
        node.path?.indexOf('node_modules') === -1 &&
        (node.title.endsWith('.ts') ||
          node.title.endsWith('.tsx') ||
          node.title.endsWith('.cs') ||
          node.title.endsWith('.py'))
      ) {
        files.push(node);
      }
      if (node.children) {
        files = files.concat(collectTsFiles(node.children));
      }
    }
    return files;
  };


  // Отправка файла на сервер с логикой повторных попыток
  const sendFileToServer = async (file: FileNode, retries = 2): Promise<void> => {
    const formData = new FormData();
    formData.append('file', new Blob([file.content || '']), file.title);
    formData.append('path', file.path!);

    try {
      setFileLoadingStatus((prev) => ({ ...prev, [file.key]: true }));
      const response = await fetch(
        // 'http://localhost:3000/api/lint', 
        'https://code-reviewer-9vcp.onrender.com/api/lint', 
        {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка на сервере');
      }

      const data = await response.json();

      // Сохраняем ответ
      setFileResponses((prev) => ({ ...prev, [file.key]: data }));
      setFileLoadingStatus((prev) => ({ ...prev, [file.key]: false }));
    } catch (error) {
      console.error(`Ошибка при отправке файла ${file.title}:`, error);
      if (retries > 0) {
        // Повторяем попытку после задержки
        await new Promise((resolve) => setTimeout(resolve, 2500));
        return sendFileToServer(file, retries - 1);
      } else {
        // Исчерпали попытки
        setFileResponses((prev) => ({
          ...prev,
          [file.key]: {
            error: 'Не удалось обработать файл после нескольких попыток',
          },
        }));
        setFileLoadingStatus((prev) => ({ ...prev, [file.key]: false }));
      }
    }
  };

  const findFileInTree = (nodes: FileNode[], targetKey: string): FileNode | null => {
    for (const node of nodes) {
      if (node.key === targetKey) {
        return node;
      }
      if (node.children) {
        const found = findFileInTree(node.children, targetKey);
        if (found) {
          setStore((prev) => ({
            ...prev,
            lastFile: {
              file: found,
            },
          }));

          return found;
        }
      }
    }
    return null;
  };

  // Обработка клика на файл
  const handleSelectFile = (file: FileNode) => {
    const selectedFile = findFileInTree(store.repoTree, file.key)!;

    setSelectedFileName(selectedFile.title);
    setSelectedFileContent(selectedFile.content);

    // Проверяем, что path существует и является строкой, прежде чем вызывать endsWith
    if (selectedFile.path && selectedFile.path.endsWith('.zip')) {
      // Это архив, нужно обработать каждый файл внутри
      selectedFile.children?.forEach((zipFile) => {
        sendFileToServer(zipFile); // Отправляем файл из архива
      });
    } else {
      // Обычный файл, отправляем на сервер
      sendFileToServer(selectedFile);
    }

    // Получаем ответ для файла
    const response = fileResponses[file.key];
    if (response) {
      if (response.error) {
        setSelectedFileIssues([{ description: response.error }]);
      } else {
        setStore((prev) => ({
          ...prev,
          lastFile: {
            ...prev.lastFile,
            response: [response.llmResponse.choices[0].message.content],
          },
        }));
        const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g;
        const jsonData = JSON.parse([...response?.matchAll(codeBlockRegex)]?.[0]?.[2]);
        if (jsonData) {
          console.log('jsonData', jsonData);
          setFilePdfData([jsonData]);
        }

        setSelectedFileIssues([response.llmResponse.choices[0].message.content]);
      }
    } else if (fileLoadingStatus[file.key]) {
      // Файл все еще обрабатывается
      setSelectedFileIssues([]);
    } else {
      // Нет ответа и не загружается; возможно, произошла ошибка
      setSelectedFileIssues([{ description: 'Ответ недоступен.' }]);
    }
  };

  // Рендер узлов дерева с индикатором загрузки
  const renderTreeNodes = (nodes: FileNode[]): any =>
    nodes.map((node) => {
      const isLoading = fileLoadingStatus[node.key];
      const isError = fileResponses[node.key]?.error;

      const title = (
        <span>
          {node.title}
          {(node.title.endsWith('.py') || node.title.endsWith('.ts') || node.title.endsWith('.tsx') || node.title.endsWith('.cs') && (
            <>
              {isLoading && <Spin size="small" style={{ marginLeft: 8 }} />}
              {isError && <WarningOutlined style={{ marginLeft: 8 }} />}
              {!(isLoading || isError) && !node.children && (
                <CheckOutlined style={{ marginLeft: 8 }} />
              )}
            </>
        ))}
        </span>
      );

      return {
        title,
        key: node.key,
        children: node.children ? renderTreeNodes(node.children) : undefined,
        isLeaf: node.isFile,
      };
    });

  // Агрегируем отчеты для общего рапорта
  const aggregatedReports = React.useMemo(() => {
    const reports = [];
    for (const fileKey in fileResponses) {
      const response = fileResponses[fileKey];
      if (response.error) continue;
      const messageContent = response?.llmResponse?.choices[0]?.message.content;
      const codeBlockRegex = /```(\w+)\n([\s\S]*?)\n```/g;
      let jsonData;
      try {
        jsonData = JSON.parse([...messageContent?.matchAll(codeBlockRegex)]?.[0]?.[2]);
      } catch (error) {
        console.error('Ошибка при парсинге JSON:', error);
      }
      if (messageContent && jsonData) {
        const highCriticalIssues = jsonData.issues.filter(
          (issue: any) =>
            issue.criticality === 'High' || issue.criticality === 'Critical',
        );

        if (highCriticalIssues.length > 0) {
          reports.push({
            file: findFileInTree(store.repoTree, fileKey)!,
            issues: highCriticalIssues,
          });
        }
      }
    }
    return reports;
  }, [fileResponses]);

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider width={300} style={{ background: '#fff', overflow: 'auto' }}>
        <Tree
          treeData={renderTreeNodes(store.repoTree)}
          onSelect={(keys, event) => {
            const node = event.node as FileNode;
            handleSelectFile(node);
          }}
          style={{
            paddingTop: '12px',
          }}
        />
      </Sider>
      <Content style={{ padding: 16, overflowY: 'scroll' }}>
        {selectedFileContent && (
          <SyntaxHighlighter language="javascript" style={darcula}>
            {selectedFileContent}
          </SyntaxHighlighter>
        )}
      </Content>
      <Content style={{ padding: 16, overflowY: 'scroll', paddingBottom: 60 }}>
        {fileLoadingStatus[
          store.repoTree.find((node) => node.title === selectedFileName)?.key || ''
        ] ? (
          <h3>Файл обрабатывается...</h3>
        ) : (
          <div>
            <h3>
              {selectedFileName
                ? `Обзор файла: ${selectedFileName}`
                : 'Выберите файл для проверки'}
            </h3>
            {selectedFileIssues.length > 0 ? (
              <>
                <Link to="/filepreview" state={selectedFileIssues}>
                  Открыть рапорт в pdf
                </Link>
                <ul>
                  {selectedFileIssues.map((issue, idx) => (
                    <li key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                      {issue.description || issue}
                    </li>
                  ))}
                </ul>
              </>
            ) : fileLoadingStatus ? (
              <p>Обработка в процессе...</p>
            ) : (
              selectedFileName && <p>Ошибок не найдено</p>
            )}
          </div>
        )}
      </Content>
      {/* Кнопка для открытия общего рапорта */}
      {allRequestsCompleted && aggregatedReports.length > 0 && (
        <Link
          to="/filepreview"
          state={aggregatedReports}
          style={{
            position: 'fixed',
            top: 16,
            left: 100,
            padding: 10,
            paddingLeft: 40,
            paddingRight: 40,
          }}
        >
          Открыть общий рапорт
        </Link>
      )}
      <Button
        type="primary"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 50,
          padding: 10,
        }}
        onClick={handleSelectFolder}
      >
        Выбрать папку
      </Button>
      <Button
        type="primary"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 170,
          padding: 10,
        }}
        onClick={() => document.getElementById('zipFileInput')?.click()} // Скрыть input по клику на кнопку
      >
        Выбрать zip
      </Button>
      <input
        type="file"
        id="zipFileInput"
        style={{ display: 'none' }} // Скрываем input
        accept=".zip"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            await handleZipFile(file); // Передаем выбранный файл в функцию
          }
        }}
      />
    </Layout>
  );
};
