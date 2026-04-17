import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(cfg => {
  const t = localStorage.getItem('token');
  if (t) cfg.headers.Authorization = `Bearer ${t}`;
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      // Don't redirect on public pages (catalog, buy page, login/register)
      const pub = ['/login', '/register', '/catalog'];
      const onPublic = pub.some(p => window.location.pathname.startsWith(p))
        || window.location.pathname.includes('/buy');
      if (!onPublic) {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(err);
  }
);

export default api;
