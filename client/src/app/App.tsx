import { Routes, Route } from 'react-router';
import Home from '../pages/Home';
import User from '../pages/User';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/user/:name" element={<User />} />
    </Routes>
  );
}

export default App;
