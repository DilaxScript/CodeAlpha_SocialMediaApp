import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);

        try {
            // POST request to Django registration endpoint: /api/users/register/
            const response = await api.post('users/register/', {
                email,
                name,
                password,
            });

            if (response.status === 201) {
                // Successful registration, redirect to login page
                alert("Registration successful! Please log in.");
                navigate('/login');
            }
        } catch (err) {
            console.error("Registration Error:", err.response);
            // Display specific errors returned by Django validation
            if (err.response && err.response.data) {
                const errors = err.response.data;
                const errorMessages = Object.keys(errors)
                    .map(key => `${key}: ${errors[key].join(', ')}`)
                    .join('\n');
                setError(`Registration failed:\n${errorMessages}`);
            } else {
                setError('Registration failed. Please try again.');
            }
        }
    };

    return (
        // Replaced inline style with responsive .container class
        <div className="container" style={{ maxWidth: '400px', border: '1px solid #ccc', borderRadius: '5px' }}>
            <h2>Register for CodeAlpha Social</h2>
            <form onSubmit={handleRegister}>
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
                    <label>Name:</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
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
                {error && <p style={{ color: 'red', whiteSpace: 'pre-wrap' }}>{error}</p>}
                {/* Replaced inline style with responsive .btn-primary class */}
                <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                    Register
                </button>
            </form>
            <p style={{ textAlign: 'center', marginTop: '15px' }}>
                Already have an account? <Link to="/login">Login here</Link>
            </p>
        </div>
    );
};

export default RegisterPage;