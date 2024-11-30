import React, { useState } from 'react';
import { Button, Tree, Layout, message } from 'antd';
import { uid } from 'uid';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { darcula } from 'react-syntax-highlighter/dist/esm/styles/prism';
import JSZip from 'jszip'; // Импорт JSZip
import { unzipFile } from '../../jszipconverter/zipconverter'; // Функция разархивирования
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
      message.error('Не удалось выбрать папку.');
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

        if (file.name.endsWith('.zip')) {
          try {
            const extractedFiles = await handleZipFile(file);
            extractedFiles.forEach((content, name) => {
              children.push({
                title: name,
                key: uid(),
                isFile: true,
                content,
              });
            });
          } catch (error) {
            console.error('Ошибка при обработке ZIP-файла:', error);
            message.error(`Не удалось обработать ZIP: ${file.name}`);
          }
        } else {
          const content = await file.text();
          children.push({
            title: file.name,
            key: uid(),
            isFile: true,
            content,
          });
        }
      } else if (entry.kind === 'directory') {
        const subChildren = await traverseDirectory(entry);
        children.push({
          title: entry.name,
          key: uid(),
          children: subChildren,
          isFile: false,
        });
      }
    }
    return children;
  };

  // Обработка ZIP-файла
  const handleZipFile = async (file: File): Promise<Record<string, string>> => {
    try {
      const files = await unzipFile(file); // Используем вашу функцию
      return files;
    } catch (error) {
      console.error('Ошибка при разархивировании файла:', error);
      throw new Error('Не удалось разархивировать файл');
    }
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
      <Sider width={300} style={{ background: '#fff', overflow: 'auto' }}>
        <Tree
          treeData={renderTreeNodes(treeData)}
          onSelect={(keys, event) => {
            const node = event.node as FileNode;
            handleSelectFile(node);
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
      <Button
        type="primary"
        style={{
          position: 'fixed',
          bottom: 16,
          left: 100,
          padding: 10,
        }}
        onClick={handleSelectFolder}
      >
        Выбрать папку
      </Button>
    </Layout>
  );
};
