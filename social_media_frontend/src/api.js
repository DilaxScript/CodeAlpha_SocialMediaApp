import axios from 'axios';
import { jwtDecode } from "jwt-decode";
import dayjs from 'dayjs'; 

const api = axios.create({
  baseURL: 'http://127.0.0.1:8000/api/', 
  timeout: 5000, 
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- AXIOS INTERCEPTOR: ATTACHES JWT TOKEN TO EVERY REQUEST ---
api.interceptors.request.use(async req => {
    const authTokens = localStorage.getItem('authTokens') 
        ? JSON.parse(localStorage.getItem('authTokens')) 
        : null;

    // 1. If no tokens, proceed without header (Anonymous user)
    if (!authTokens) return req; 

    // 2. Attach Access Token to the Authorization Header
    req.headers.Authorization = `Bearer ${authTokens.access}`;

    // 3. Check if the token is expired (using dayjs)
    const user = jwtDecode(authTokens.access);
    const isExpired = dayjs.unix(user.exp).diff(dayjs()) < 1; 

    // 4. If token is not expired, continue request
    if (!isExpired) return req;

    // 5. If expired, attempt to refresh token before sending request
    try {
        const response = await axios.post('http://127.0.0.1:8000/api/token/refresh/', {
            refresh: authTokens.refresh
        });

        localStorage.setItem('authTokens', JSON.stringify(response.data));
        // Update the header of the current request with the new token
        req.headers.Authorization = `Bearer ${response.data.access}`; 
    } catch (error) {
        console.error("Interceptor: Token refresh failed. User likely needs to log in.");
        // We rely on AuthContext to log out the user, but for safety:
        // You might consider clearing tokens here if refresh fails critically.
    }
    
    return req;
});

export default api;