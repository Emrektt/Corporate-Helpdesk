import { Configuration, PublicClientApplication } from "@azure/msal-browser";

// Bu değerler Azure portalından alınacaktır. Şimdilik çevresel değişkenlerden (veya sabit değerlerden) okunuyor.
export const msalConfig: Configuration = {
    auth: {
        clientId: import.meta.env.VITE_MSAL_CLIENT_ID || "BURAYA_CLIENT_ID_GELECEK",
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MSAL_TENANT_ID || "BURAYA_TENANT_ID_GELECEK"}`,
        redirectUri: import.meta.env.VITE_MSAL_REDIRECT_URI || "http://localhost:5173",
    },
    cache: {
        cacheLocation: "sessionStorage", // Token'ların saklanacağı yer
        storeAuthStateInCookie: false,
    }
};

// İstek yaparken hangi izinlere (scopes) ihtiyaç duyduğumuz
export const loginRequest = {
    scopes: ["User.Read", import.meta.env.VITE_MSAL_API_SCOPE || ""] 
};

export const msalInstance = new PublicClientApplication(msalConfig);
