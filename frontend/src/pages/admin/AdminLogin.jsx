import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { LoadingSpinner, Alert } from '../../components/ui/CommonComponents';

function AdminLogin() {
    const navigate     = useNavigate();
    const { adminLogin } = useAuth();
    const [loading, setLoading]         = useState(false);
    const [error, setError]             = useState('');
    const [success, setSuccess]         = useState('');
    const [username, setUsername]       = useState('');
    const [password, setPassword]       = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [shaking, setShaking]         = useState(false);

    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        if (!username.trim()) { setError('Username diperlukan'); triggerShake(); return; }
        if (password.length < 4) { setError('Password minimal 4 karakter'); triggerShake(); return; }

        setLoading(true);
        try {
            const response = await adminAPI.login(username, password);
            if (response && response.data && response.data.accessToken) {
                setSuccess('Akses diberikan — memasuki Command Center...');
                adminLogin(response.data);
                setTimeout(() => navigate('/admin/dashboard'), 1200);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Kredensial tidak valid');
            triggerShake();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
            {/* Dark radial bg */}
            <div style={{
                position: 'fixed', inset: 0,
                background: `
                    radial-gradient(ellipse at 50% 100%, rgba(80,20,10,0.3) 0%, transparent 60%),
                    radial-gradient(ellipse at 50% 0%,   rgba(40,25,10,0.2) 0%, transparent 50%)
                `,
                pointerEvents: 'none',
            }} />

            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
                style={{ position: 'fixed', top: 20, left: 20, zIndex: 20, padding: '8px 16px', fontSize: 11 }}
            >
                ← Kembali
            </button>

            {/* Card */}
            <div style={{
                position: 'relative', zIndex: 10,
                width: '100%', maxWidth: 400,
                padding: '0 20px',
                animation: shaking ? 'shake 0.5s ease' : 'fadeInDown 0.7s ease',
            }}>
                <div style={{
                    background: 'linear-gradient(160deg, rgba(22,15,8,0.98), rgba(8,5,2,0.99))',
                    border: '1px solid rgba(200,150,12,0.25)',
                    borderRadius: 4,
                    padding: '40px 32px',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Top accent */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: 'linear-gradient(90deg, transparent, var(--ember), transparent)',
                    }} />

                    {/* Watermark */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '8rem',
                            color: 'rgba(139,17,17,0.04)',
                            transform: 'rotate(-15deg)',
                            userSelect: 'none',
                        }}>
                            ADMIN
                        </div>
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 32 }}>
                        {/* Badge icon */}
                        <div style={{
                            width: 52, height: 52,
                            border: '2px solid rgba(200,150,12,0.3)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            background: 'rgba(139,17,17,0.15)',
                            fontSize: 22,
                        }}>
                            ✦
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 10, letterSpacing: '0.35em',
                            textTransform: 'uppercase',
                            color: 'rgba(192,57,43,0.7)',
                            marginBottom: 10,
                        }}>
                            ── Akses Terbatas ──
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.4rem, 4vw, 1.9rem)',
                            color: 'var(--gold-bright)',
                            letterSpacing: '0.08em',
                            textShadow: '0 0 30px rgba(200,150,12,0.25)',
                        }}>
                            Command Center
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontStyle: 'italic',
                            fontSize: 12,
                            color: 'rgba(200,170,120,0.35)',
                            marginTop: 6,
                        }}>
                            Hanya untuk panitia yang berwenang
                        </div>
                    </div>

                    <Alert type="error"   message={error}   onClose={() => setError('')} />
                    <Alert type="success" message={success} onClose={() => setSuccess('')} />

                    <form onSubmit={handleLogin}>
                        <div style={{ marginBottom: 16 }}>
                            <label className="form-label">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Masukkan username"
                                className="input-field"
                                disabled={loading}
                                autoComplete="username"
                            />
                        </div>

                        <div style={{ marginBottom: 28 }}>
                            <label className="form-label">Password</label>
                            <div style={{ position: 'relative' }}>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Masukkan password"
                                    className="input-field"
                                    disabled={loading}
                                    autoComplete="current-password"
                                    style={{ paddingRight: 44 }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: 12, top: '50%',
                                        transform: 'translateY(-50%)',
                                        background: 'none', border: 'none',
                                        cursor: 'pointer',
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: 10, letterSpacing: '0.1em',
                                        color: 'var(--gold-dim)',
                                        textTransform: 'uppercase',
                                    }}
                                >
                                    {showPassword ? 'HIDE' : 'SHOW'}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary"
                            style={{ width: '100%', padding: '14px', fontSize: 13 }}
                        >
                            {loading
                                ? <><LoadingSpinner />&nbsp; Memverifikasi...</>
                                : '✦ Ambil Komando'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: 24,
                        paddingTop: 18,
                        borderTop: '1px solid rgba(200,150,12,0.08)',
                        textAlign: 'center',
                        fontFamily: 'var(--font-heading)',
                        fontSize: 10, letterSpacing: '0.18em',
                        textTransform: 'uppercase',
                        color: 'rgba(200,170,120,0.2)',
                    }}>
                        Pemira 2026–2027 · Admin Panel
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminLogin;