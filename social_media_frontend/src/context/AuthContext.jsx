import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api'; // Your configured Axios instance
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from "jwt-decode";

// Create the context object
const AuthContext = createContext();

// ✅ Fixed: Proper export for Fast Refresh
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Component that provides authentication state and functions
export const AuthProvider = ({ children }) => {
    const [authTokens, setAuthTokens] = useState(() => 
        localStorage.getItem('authTokens') ? JSON.parse(localStorage.getItem('authTokens')) : null
    );
    const [user, setUser] = useState(() => 
        localStorage.getItem('authTokens') ? jwtDecode(JSON.parse(localStorage.getItem('authTokens')).access) : null
    );
    const [loading, setLoading] = useState(true);

    const navigate = useNavigate();

    // --- 1. LOGIN FUNCTION ---
    const loginUser = async (email, password) => {
        try {
            const response = await api.post('token/', { email, password });
            
            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
                
                navigate('/');
            }
        } catch (error) {
            console.error("Login failed:", error.response ? error.response.data : error.message);
            alert("Login Failed: Check credentials.");
            throw error; // ✅ Important: Re-throw error for handling in components
        }
    };

    // --- 2. LOGOUT FUNCTION ---
    const logoutUser = useCallback(() => {
        setAuthTokens(null);
        setUser(null);
        localStorage.removeItem('authTokens');
        navigate('/login');
    }, [navigate]);

    // --- 3. TOKEN REFRESH LOGIC ---
    // ✅ Fixed: Added useCallback to prevent infinite re-renders
    const updateToken = useCallback(async () => {
        const refreshToken = authTokens?.refresh;
        if (!refreshToken) {
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('token/refresh/', { refresh: refreshToken });

            if (response.status === 200) {
                const data = response.data;
                setAuthTokens(data);
                setUser(jwtDecode(data.access));
                localStorage.setItem('authTokens', JSON.stringify(data));
            } else {
                logoutUser();
            }
        } catch (error) {
            console.error("Token refresh failed:", error);
            logoutUser();
        }

        if (loading) {
            setLoading(false);
        }
    }, [authTokens, logoutUser, loading]);

    // ✅ Fixed: Add axios interceptor to handle token refresh on 401 errors
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                
                if (error.response?.status === 401 && !originalRequest._retry) {
                    originalRequest._retry = true;
                    
                    try {
                        await updateToken();
                        // Retry the original request with new token
                        return api(originalRequest);
                    } catch (refreshError) {
                        logoutUser();
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [updateToken, logoutUser]);

    // ✅ Fixed: Initial token check and refresh interval
    useEffect(() => {
        let intervalId = null;

        const setupTokenRefresh = async () => {
            if (authTokens) {
                // Check if token is about to expire
                const decodedToken = jwtDecode(authTokens.access);
                const currentTime = Date.now() / 1000;
                const timeUntilExpiry = decodedToken.exp - currentTime;
                
                // If token expires in less than 2 minutes, refresh immediately
                if (timeUntilExpiry < 120) {
                    await updateToken();
                }
                
                // Set up interval for refreshing (every 4 minutes as before)
                const MINUTE = 1000 * 60; 
                const interval = 4 * MINUTE;
                
                intervalId = setInterval(() => {
                    updateToken();
                }, interval);
            } else {
                setLoading(false);
            }
        };

        setupTokenRefresh();

        return () => {
            if (intervalId) {
                clearInterval(intervalId);
            }
        };
    }, [authTokens, updateToken]); // ✅ Fixed: Added updateToken to dependencies

    const contextData = {
        user,
        authTokens,
        loginUser,
        logoutUser,
        loading,
    };

    return (
        <AuthContext.Provider value={contextData}>
            {children}
        </AuthContext.Provider>
    );
};