import { Routes, Route } from 'react-router';
import Home from '../pages/Home';
import FilePreview from '../pages/FilePreview';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/filepreview" element={<FilePreview />} />
    </Routes>
  );
}

export default App;
