import { Routes, Route } from 'react-router';
import Home from '../pages/Home';
import FilePreview from '../pages/FilePreview';
import { StoreProvider } from '../features/store/model/StoreContext';

function App() {
  return (
    <StoreProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/filepreview" element={<FilePreview />} />
      </Routes>
    </StoreProvider>
  );
}

export default App;
