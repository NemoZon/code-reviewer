export type FileNode = {
    key: string;
    title: string;
    isLeaf: boolean;
    children?: FileNode[];
  };
  