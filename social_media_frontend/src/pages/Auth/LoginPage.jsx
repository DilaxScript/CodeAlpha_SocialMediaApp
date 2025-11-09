import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const { loginUser } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loginError, setLoginError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoginError(null);
        
        if (!email || !password) {
            setLoginError("Please enter both email and password.");
            return;
        }

        try {
            // loginUser handles the API call, token storage, and navigation
            await loginUser(email, password);
        } catch (error) {
            // Note: loginUser handles the error alert internally, but we set local state too.
            // If the loginUser function doesn't throw a specific error, this catches general issues.
            setLoginError("Login failed. Please check your credentials.");
        }
    };

    return (
        // Replaced inline style with responsive .container class
        <div className="container" style={{ maxWidth: '400px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Email:</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        // Removed inline styles, relies on index.css
                    />
                </div>
                <div style={{ marginBottom: '15px' }}>
                    <label>Password:</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        // Removed inline styles, relies on index.css
                    />
                </div>
                {loginError && <p style={{ color: 'red' }}>{loginError}</p>}
                {/* Replaced inline style with responsive .btn-success class */}
                <button type="submit" className="btn-success" style={{ width: '100%' }}>
                    Login
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                Don't have an account? <Link to="/register">Register now</Link>
            </p>
        </div>
    );
};

export default LoginPage;