import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Flags from './pages/Flags';
import AuditLogs from './pages/AuditLogs';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/flags" element={  <ProtectedRoute>
      <Flags />
    </ProtectedRoute>} />
     <Route
  path="/audit-logs"
  element={
    <ProtectedRoute>
      <AuditLogs />
    </ProtectedRoute>
  }
/>
    </Routes>
  );
}

export default App;