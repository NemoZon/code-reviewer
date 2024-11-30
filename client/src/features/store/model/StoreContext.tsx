import React, {
  createContext,
  useState,
  useContext,
  ReactNode,
  Dispatch,
  SetStateAction,
} from 'react';
import { FileNode } from '../../file-picker/model/types';
import { Json } from '../../converter/model/types';

interface IStore {
  repoTree: FileNode[];
  files: Json[];
  lastFile: {
    response?: string[];
    file?: FileNode;
  } | null;
}

// Тип значения, которое предоставляет контекст
interface IStoreContext {
  store: IStore;
  setStore: Dispatch<SetStateAction<IStore>>;
}

// Создаём контекст
const StoreContext = createContext<IStoreContext | null>(null);

// Провайдер контекста
export const StoreProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<IStore>({
    repoTree: [],
    files: [],
    lastFile: null,
  });

  return (
    <StoreContext.Provider value={{ store, setStore }}>
      {children}
    </StoreContext.Provider>
  );
};

// Хук для использования контекста
export const useStore = () => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
};
