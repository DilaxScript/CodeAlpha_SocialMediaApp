import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext'; 
import Header from './components/Header';
import FeedPage from './pages/FeedPage';
import LoginPage from './pages/Auth/LoginPage';
import RegisterPage from './pages/Auth/RegisterPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App" style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
          <Header />
          <main style={{ 
            padding: '20px', 
            minHeight: 'calc(100vh - 80px)',
            maxWidth: '1200px',
            margin: '0 auto',
            width: '100%',
            boxSizing: 'border-box'
          }}>
            <Routes>
              <Route path="/" element={<FeedPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/profile/:userId" element={<ProfilePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              
              {/* Fallback route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;