import { useState } from 'react';
import { Linter } from 'eslint';

export type FileNode = {
  key: string;
  title: string;
  isLeaf: boolean;
  status?: 'success' | 'error' | 'loading'; // Добавлено состояние загрузки
  errors?: string[];
  children?: FileNode[];
};

async function getFileTree(
  directory: FileSystemDirectoryHandle,
): Promise<FileNode[]> {
  const result: FileNode[] = [];
  for await (const [name, handle] of directory.entries()) {
    const isFile = handle.kind === 'file';
    result.push({
      key: handle.name,
      title: handle.name,
      isLeaf: isFile,
      children: isFile
        ? undefined
        : await getFileTree(handle as FileSystemDirectoryHandle),
    });
  }
  return result;
}

export function useFileTree() {
  const [treeData, setTreeData] = useState<FileNode[]>([]);
  const [selectedFileErrors, setSelectedFileErrors] = useState<string[]>([]);

  const loadDirectory = async () => {
    try {
      const directory = await window.showDirectoryPicker();
      const files = await getFileTree(directory);
      setTreeData(files);
    } catch (error) {
      console.error('Ошибка выбора папки:', error);
    }
  };

  const lintFile = async (fileHandle: FileSystemFileHandle) => {
    try {
      const file = await fileHandle.getFile();
      const content = await file.text();

      const linter = new Linter();
      const config = {
        parser: '@typescript-eslint/parser',
        parserOptions: { ecmaVersion: 2020 },
        rules: {
          '@typescript-eslint/no-unused-vars': 'error',
          semi: ['error', 'always'],
        },
      };

      const messages = linter.verify(content, config);

      return messages.map(
        (msg) => `${msg.message} (line ${msg.line}, column ${msg.column})`,
      );
    } catch (error) {
      console.error('Ошибка проверки файла:', error);
      return ['Ошибка при чтении файла'];
    }
  };

  const checkFile = async (node: FileNode, handle: FileSystemFileHandle) => {
    node.status = 'loading'; // Установка состояния загрузки
    setTreeData([...treeData]); // Обновление состояния для отображения загрузки

    const errors = await lintFile(handle);
    const status = errors.length === 0 ? 'success' : 'error';

    node.status = status; // Обновление состояния по завершении проверки
    node.errors = errors;
    setSelectedFileErrors(errors);
    setTreeData([...treeData]);
  };

  return { treeData, loadDirectory, checkFile, selectedFileErrors };
}
