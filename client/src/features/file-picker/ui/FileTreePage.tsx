import React, { useState } from 'react';
import { Button, Tree, Layout, message } from 'antd';
import { uid } from 'uid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import Link from '../../../shared/links/ui/Link';
const { Content, Sider } = Layout;

type FileNode = {
  title: string;
  key: string;
  children?: FileNode[];
  isFile: boolean;
  content?: string;
};

export const FileTreePage: React.FC = () => {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [selectedFileErrors, setSelectedFileErrors] = useState<string[]>([]);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [selectedFileContent, setSelectedFileContent] = useState<string>();

  const [isLoading, setIsLoading] = useState(false);

  // Обработка выбора папки
  const handleSelectFolder = async () => {
    try {
      const directoryHandle = await window.showDirectoryPicker();
      const files = await traverseDirectory(directoryHandle);
      setTreeData(files);
    } catch (error) {
      console.error('Ошибка при выборе папки:', error);
    }
  };

  // Рекурсивное чтение директорий
  const traverseDirectory = async (
    directoryHandle: FileSystemDirectoryHandle,
  ): Promise<FileNode[]> => {
    const children: FileNode[] = [];
    for await (const entry of directoryHandle.values()) {
      if (entry.kind === 'file') {
        const file = await entry.getFile();
        const content = await file.text();
        const fileKey = uid();
        children.push({
          title: file.name,
          key: fileKey,
          isFile: true,
          content,
        });
      } else if (entry.kind === 'directory') {
        const subChildren = await traverseDirectory(entry);
        const dirKey = uid();

        children.push({
          title: entry.name,
          key: dirKey,
          children: subChildren,
          isFile: false,
        });
      }
    }
    return children;
  };

  // Отправка файла на сервер для проверки
  const lintFileOnServer = async (file: FileNode) => {
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

    // Находим файл в `treeData`
    const selectedFile = findFileInTree(treeData, file.key);

    if (!selectedFile || !selectedFile.content) {
      message.error('Файл не найден или его содержимое отсутствует.');
      return;
    }
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([selectedFile.content]),
      selectedFile.title,
    );

    try {
      setIsLoading(true);
      setSelectedFileContent(selectedFile.content);
      const response = await fetch('http://localhost:3000/api/lint', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Ошибка на сервере');
      }

      const data = await response.json();
      setSelectedFileErrors([data.llmResponse.choices[0].message.content]);
      //   setSelectedFileErrors(data.errors.map((err: any) => `${err.message} (line ${err.line}, column ${err.column})`));
      setSelectedFileName(selectedFile.title);
    } catch (error) {
      console.error('Ошибка при отправке файла:', error);
      message.error('Не удалось проверить файл.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработка клика на файл
  const handleSelectFile = (file: FileNode) => {
    lintFileOnServer(file);
  };

  // Рендер узлов дерева
  const renderTreeNodes = (nodes: FileNode[]): React.ReactNode =>
    nodes.map((node) => ({
      title: node.title,
      key: node.key,
      children: node.children ? renderTreeNodes(node.children) : undefined,
      isLeaf: node.isFile,
    }));

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider
        width={300}
        style={{ background: '#fff', overflow: 'auto', marginBottom: 60 }}
      >
        <Tree
          treeData={renderTreeNodes(treeData)}
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
      <Content
        style={{ padding: 16, overflowY: 'scroll', paddingBottom: 60 }}
      >
        {isLoading ? (
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
                <ul>
                  {selectedFileErrors.map((error, idx) => (
                    <li key={idx} style={{ whiteSpace: 'pre-wrap' }}>
                      {error}
                    </li>
                  ))}
                </ul>
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
