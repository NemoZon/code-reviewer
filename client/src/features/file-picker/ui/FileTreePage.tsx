import React, { useEffect, useState } from 'react';
import { Button, Tree, Layout, message, Spin } from 'antd';
import { uid } from 'uid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from '../../../shared/links/ui/Link';
import { useStore } from '../../store/model/StoreContext';
import { FileNode } from '../model/types';
const { Content, Sider } = Layout;

export const FileTreePage: React.FC = () => {
  const [selectedFileErrors, setSelectedFileErrors] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>();

  const [fileResponses, setFileResponses] = useState<{ [key: string]: any }>({});
  const [fileLoadingStatus, setFileLoadingStatus] = useState<{
    [key: string]: boolean;
  }>({});

  const { store, setStore } = useStore();

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

      // Собираем все ts и tsx файлы и отправляем их на сервер
      const tsFiles = collectTsFiles(files);
      tsFiles.forEach((file) => {
        sendFileToServer(file);
      });
    } catch (error) {
      console.error('Ошибка при выборе папки:', error);
    }
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

        children.push({
          title: file.name,
          key: fileKey,
          isFile: true,
          content,
          path: entryPath, // Добавляем путь
        });
      } else if (entry.kind === 'directory') {
        const subChildren = await traverseDirectory(entry, entryPath); // Передаем обновленный путь
        const dirKey = uid();

        children.push({
          title: entry.name,
          key: dirKey,
          children: subChildren,
          isFile: false,
          path: entryPath, // Добавляем путь для директории
        });
      }
    }

    return children;
  };

  // Собираем все ts и tsx файлы из дерева
  const collectTsFiles = (nodes: FileNode[]): FileNode[] => {
    let files: FileNode[] = [];
    for (const node of nodes) {
      if (
        node.isFile &&
        (node.title.endsWith('.ts') || node.title.endsWith('.tsx'))
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
  const sendFileToServer = async (file: FileNode, retries = 3) => {
    const formData = new FormData();
    formData.append('file', new Blob([file.content || '']), file.title);
    formData.append('path', file.path);

    try {
      setFileLoadingStatus((prev) => ({ ...prev, [file.key]: true }));
      const response = await fetch('http://localhost:3000/api/lint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка на сервере');
      }

      const data = await response.json();

      // Сохраняем ответ
      setFileResponses((prev) => ({ ...prev, [file.key]: data }));
    } catch (error) {
      console.error(`Ошибка при отправке файла ${file.title}:`, error);
      if (retries > 0) {
        // Повторяем попытку после задержки
        setTimeout(() => {
          sendFileToServer(file, retries - 1);
        }, 1000);
      } else {
        // Если попытки исчерпаны, сохраняем ошибку
        setFileResponses((prev) => ({
          ...prev,
          [file.key]: { error: 'Не удалось обработать файл после нескольких попыток' },
        }));
      }
    } finally {
      setFileLoadingStatus((prev) => ({ ...prev, [file.key]: false }));
    }
  };

  // Обработка клика на файл
  const handleSelectFile = (file: FileNode) => {

    const findFileInTree = (
      nodes: FileNode[],
      targetKey: string,
    ): FileNode | null => {
      for (const node of nodes) {
        if (node.key === targetKey) {
          return node;
        }
        if (node.children) {
          const found = findFileInTree(node.children, targetKey);
          if (found) {
            return found;
          }
        }
      }
      return null;
    };

    const selectedFile = findFileInTree(store.repoTree, file.key)!;

    setSelectedFileName(selectedFile.title);
    setSelectedFileContent(selectedFile.content);

    // Получаем ответ для файла
    const response = fileResponses[file.key];
    if (response) {
      if (response.error) {
        setSelectedFileErrors([response.error]);
      } else {
        setSelectedFileErrors([
          response.llmResponse.choices[0].message.content,
        ]);
      }
    } else if (fileLoadingStatus[file.key]) {
      // Файл все еще обрабатывается
      setSelectedFileErrors([]);
    } else {
      // Нет ответа и не загружается; возможно, произошла ошибка
      setSelectedFileErrors(['Ответ недоступен.']);
    }
  };

  // Рендер узлов дерева с индикатором загрузки
  const renderTreeNodes = (nodes: FileNode[]): any =>
    nodes.map((node) => {
      const isLoading = fileLoadingStatus[node.key];
      const title = (
        <span>
          {node.title}
          {isLoading && <Spin size="small" style={{ marginLeft: 8 }} />}
        </span>
      );

      return {
        title,
        key: node.key,
        children: node.children ? renderTreeNodes(node.children) : undefined,
        isLeaf: node.isFile,
      };
    });

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={300}
        style={{ background: '#fff', overflow: 'auto', marginBottom: 60 }}
      >
        <Tree
          treeData={renderTreeNodes(store.repoTree)}
          onSelect={(keys, event) => {
            const node = event.node as FileNode;
            handleSelectFile(node);
          }}
        />
      </Sider>
      <Content style={{ padding: 16, overflowY: 'scroll', paddingBottom: 60 }}>
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
            {selectedFileErrors.length > 0 ? (
              <>
                <Link
                  to="/filepreview"
                  state={{
                    file: selectedFileName,
                    score: 80,
                    issues: selectedFileErrors,
                  }}
                >
                  Открыть рапорт в pdf
                </Link>
                <ul>
                  {selectedFileErrors.map((error, idx) => (
                    <li key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                      {error}
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              selectedFileName && <p>Ошибок не найдено</p>
            )}
          </div>
        )}
      </Content>
      <Button
        type="primary"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 100,
          padding: 10,
          paddingLeft: 40,
          paddingRight: 40,
        }}
        onClick={handleSelectFolder}
      >
        Выбрать папку
      </Button>
    </Layout>
  );
};
