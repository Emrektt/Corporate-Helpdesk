import axios from 'axios';
import { msalInstance } from '../auth/msal-config';

// Backend API URL'i
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8001';

export const axiosClient = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Her istekten önce çalışıp araya (interceptor) girerek header'a MSAL Token ekler
axiosClient.interceptors.request.use(async (config) => {
    try {
        // Önce yerel token (e-posta/şifre girişi) var mı diye kontrol et
        const localToken = localStorage.getItem('token');
        if (localToken) {
            config.headers.Authorization = `Bearer ${localToken}`;
            return config;
        }

        const account = msalInstance.getActiveAccount() || msalInstance.getAllAccounts()[0];
        
        if (account) {
            // Sessizce arka plandan token almayı dene
            const response = await msalInstance.acquireTokenSilent({
                scopes: ["User.Read", import.meta.env.VITE_MSAL_API_SCOPE || ""], // Backend için olan scopes
                account: account
            });
            
            // Eğer token alındıysa isteğe ekle
            if (response.accessToken) {
                config.headers.Authorization = `Bearer ${response.accessToken}`;
            }
        }
    } catch (error) {
        console.error("Token alınırken bir hata oluştu: ", error);
        // Eğer token süresi dolmuşsa veya sessizce alınamıyorsa kullanıcıyı loginPopup/loginRedirect'e yönlendirebiliriz.
    }
    
    return config;
}, (error) => {
    return Promise.reject(error);
});
