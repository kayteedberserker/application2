// utils/api.js
const APP_SECRET = "thisismyrandomsuperlongsecretkey"; // 🔹 Ensure this matches Vercel exactly!

export const apiFetch = async (endpoint, options = {}) => {
  // 1. Fix URL construction to avoid double /api/api
  const baseUrl = "https://oreblogda.com/api";
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = endpoint.startsWith('http') ? endpoint : `${baseUrl}${cleanEndpoint}`;
  
  // 2. Prepare headers
  const headers = {
    "x-oreblogda-secret": APP_SECRET,
    ...options.headers,
  };

  // 3. 🔹 SMART CONTENT-TYPE: 
  // Only add JSON header if we have a body AND it's not FormData
  if (options.body && !(options.body instanceof FormData) && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(url, {
    ...options,
    headers,
  });
};

export default apiFetch;
