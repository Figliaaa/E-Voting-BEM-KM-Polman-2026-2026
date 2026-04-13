import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [voterAuth, setVoterAuth] = useState(null);
    const [adminAuth, setAdminAuth] = useState(null);
    const [loading, setLoading]     = useState(false);
    const [error, setError]         = useState(null);

    useEffect(() => {
        const voterToken = localStorage.getItem('voterToken');
        if (voterToken) {
            setVoterAuth({
                token:  voterToken,
                nim:    localStorage.getItem('voterNim'),
                name:   localStorage.getItem('voterName'),
            });
        }

        const adminToken = localStorage.getItem('adminToken');
        if (adminToken) {
            setAdminAuth({
                token:     adminToken,
                username:  localStorage.getItem('adminUsername'),
                full_name: localStorage.getItem('adminFullName'),
                id:        localStorage.getItem('adminId'),
            });
        }
    }, []);

    const voterLogin = (data) => {
        const auth = {
            token: data.accessToken,
            nim:   data.voter.nim,
            name:  data.voter.nama,
        };
        setVoterAuth(auth);
        localStorage.setItem('voterToken', data.accessToken);
        localStorage.setItem('voterNim',   data.voter.nim);
        localStorage.setItem('voterName',  data.voter.nama);
    };

    const voterLogout = () => {
        setVoterAuth(null);
        localStorage.removeItem('voterToken');
        localStorage.removeItem('voterNim');
        localStorage.removeItem('voterName');
    };

    /**
     * Accepts either:
     *   adminLogin(data)            where data = { accessToken, admin: { username, id, full_name } }
     *   adminLogin(token, username, full_name)   legacy 3-arg form
     */
    const adminLogin = (dataOrToken, legacyUsername, legacyFullName) => {
        let auth;

        if (typeof dataOrToken === 'string') {
            auth = {
                token:     dataOrToken,
                username:  legacyUsername  || '',
                full_name: legacyFullName  || '',
                id:        '',
            };
        } else {
            const data = dataOrToken;
            auth = {
                token:     data.accessToken,
                username:  data.admin?.username  || '',
                full_name: data.admin?.full_name || '',
                id:        data.admin?.id        || '',
            };
        }

        setAdminAuth(auth);
        localStorage.setItem('adminToken',    auth.token);
        localStorage.setItem('adminUsername', auth.username);
        localStorage.setItem('adminFullName', auth.full_name);
        localStorage.setItem('adminId',       auth.id);
    };

    const adminLogout = () => {
        setAdminAuth(null);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUsername');
        localStorage.removeItem('adminFullName');
        localStorage.removeItem('adminId');
    };

    const logout = () => { voterLogout(); adminLogout(); };
    const clearError = () => setError(null);

    return (
        <AuthContext.Provider value={{
            voterAuth,
            adminAuth,
            loading,
            error,
            voterLogin,
            voterLogout,
            adminLogin,
            adminLogout,
            logout,
            setError,
            clearError,
            setLoading,
            isVoterLoggedIn: !!voterAuth,
            isAdminLoggedIn: !!adminAuth,
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within AuthProvider');
    return ctx;
}