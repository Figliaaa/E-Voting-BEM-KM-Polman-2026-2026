import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const voterToken = localStorage.getItem('voterToken');
    const adminToken = localStorage.getItem('adminToken');
    
    if (voterToken || adminToken) {
        config.headers.Authorization = `Bearer ${voterToken || adminToken}`;
    }
    
    return config;
});

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Unauthorized - clear storage and redirect
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);


export const voterAPI = {
    login: (nim, token) => 
        api.post('/voter/login', { nim, token }),
    
    vote: (candidateId) => 
        api.post('/voter/vote', { candidateId }),
    
    getStatus: () => 
        api.get('/voter/status'),
};


export const adminAPI = {
    login: (username, password) => 
        api.post('/admin/login', { username, password }),
    
    getCandidates: () => 
        api.get('/admin/candidates'),
    
    addCandidate: (data) => 
        api.post('/admin/candidates', data),
    
    updateCandidate: (id, data) => 
        api.put(`/admin/candidates/${id}`, data),
    
    deleteCandidate: (id) => 
        api.delete(`/admin/candidates/${id}`),
    
    getStatistics: () => 
        api.get('/stats/detailed'),
    
    getVoters: (page = 1, limit = 50, search = '') => 
        api.get('/admin/voters', { params: { page, limit, search } }),
    
    getVoterDetails: (nim) => 
        api.get(`/admin/voters/${nim}`),
    
    activateToken: (nim) => 
        api.post(`/admin/voters/${nim}/activate-token`),
    
    bulkActivateTokens: (nims) => 
        api.post('/admin/voters/bulk-activate', { nims }),
    
    resetVote: (nim) => 
        api.post(`/admin/voters/${nim}/reset-vote`),
};


export const publicAPI = {
    getCandidates: () => 
        api.get('/candidates'),
    
    getStatsSummary: () => 
        api.get('/stats/summary'),
    
    getStatsDetailed: () => 
        api.get('/stats/detailed'),
    
    health: () => 
        api.get('/health'),
};

export default api;
