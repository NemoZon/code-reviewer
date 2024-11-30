export type FileNode = {
  key: string;
  title: string;
  isLeaf?: boolean;
  isFile?: boolean;
  content?: string;
  path?: string;
  status?: 'success' | 'error' | 'loading'; // Добавлено состояние загрузки
  errors?: string[];
  children?: FileNode[];
};
