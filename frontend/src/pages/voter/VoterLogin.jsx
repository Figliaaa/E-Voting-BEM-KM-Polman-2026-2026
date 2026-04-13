import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { voterAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import {
    LoadingSpinner, Alert, TumbleweedBackground, ValidationInput
} from '../../components/ui/CommonComponents';

function VoterLogin() {
    const navigate   = useNavigate();
    const { voterLogin, setError: setAuthError, setLoading } = useAuth();
    const [nim, setNim]             = useState('');
    const [token, setToken]         = useState('');
    const [error, setError]         = useState('');
    const [success, setSuccess]     = useState('');
    const [localLoading, setLocalLoading] = useState(false);
    const [shaking, setShaking]     = useState(false);
    const formRef = useRef(null);

    const triggerShake = () => {
        setShaking(true);
        setTimeout(() => setShaking(false), 600);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        if (!nim.trim() || nim.length !== 9) {
            setError('NIM harus tepat 9 digit angka');
            triggerShake(); return;
        }
        if (!token.trim() || token.length !== 6) {
            setError('Kode akses harus tepat 6 karakter');
            triggerShake(); return;
        }
        setLocalLoading(true);
        setError('');
        setLoading(true);
        try {
            const response = await voterAPI.login(nim.trim(), token.toUpperCase().trim());
            if (response.data.success) {
                voterLogin(response.data);
                setSuccess('Identitas terverifikasi — memasuki bilik suara...');
                setTimeout(() => navigate('/vote'), 1600);
            }
        } catch (err) {
            const msg = err.response?.data?.message || 'Autentikasi gagal';
            setError(msg);
            setAuthError(msg);
            triggerShake();
        } finally {
            setLocalLoading(false);
            setLoading(false);
        }
    };

    return (
        <div className="app-container" style={{
            alignItems: 'center', justifyContent: 'center',
        }}>
            <TumbleweedBackground />

            {/* Vignette */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse at center, transparent 20%, rgba(0,0,0,0.8) 100%)',
            }} />

            {/* Back button */}
            <button
                onClick={() => navigate('/')}
                className="btn btn-secondary"
                style={{
                    position: 'fixed', top: 20, left: 20, zIndex: 20,
                    padding: '8px 16px', fontSize: 11,
                }}
            >
                ← Kembali
            </button>

            {/* Login card */}
            <div
                ref={formRef}
                style={{
                    position: 'relative', zIndex: 10,
                    width: '100%', maxWidth: 420,
                    padding: '0 20px',
                    animation: shaking ? 'shake 0.5s ease' : 'fadeInUp 0.7s ease',
                }}
            >
                {/* Wanted poster frame */}
                <div style={{
                    background: 'linear-gradient(160deg, rgba(28,20,12,0.98), rgba(10,7,3,0.99))',
                    border: '1px solid rgba(200,150,12,0.3)',
                    borderRadius: 4,
                    padding: '36px 32px',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.8), 0 0 0 1px rgba(200,150,12,0.05)',
                    position: 'relative',
                    overflow: 'hidden',
                }}>
                    {/* Top accent line */}
                    <div style={{
                        position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                        background: 'linear-gradient(90deg, transparent, var(--gold-dim), transparent)',
                    }} />

                    {/* Watermark */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none', overflow: 'hidden',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '10rem', fontWeight: 900,
                            color: 'rgba(200,150,12,0.025)',
                            transform: 'rotate(-20deg)',
                            userSelect: 'none', whiteSpace: 'nowrap',
                        }}>
                            PEMIRA
                        </div>
                    </div>

                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: 28 }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 10, letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: 'var(--gold-dim)',
                            marginBottom: 12,
                        }}>
                            ── Bilik Suara ──
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.6rem, 5vw, 2.2rem)',
                            color: 'var(--gold-bright)',
                            textShadow: '0 0 30px rgba(200,150,12,0.3)',
                            letterSpacing: '0.06em',
                        }}>
                            Identifikasi
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontStyle: 'italic',
                            fontSize: 13,
                            color: 'rgba(200,170,120,0.4)',
                            marginTop: 6,
                        }}>
                            Masukkan data diri untuk melanjutkan
                        </div>
                    </div>

                    {/* Alerts */}
                    <Alert type="error"   message={error}   onClose={() => setError('')} />
                    <Alert type="success" message={success} onClose={() => setSuccess('')} />

                    <form onSubmit={handleLogin}>
                        {/* NIM field */}
                        <div style={{ marginBottom: 18 }}>
                            <label className="form-label">NIM — 9 Digit</label>
                            <ValidationInput
                                type="text"
                                placeholder="112140001"
                                value={nim}
                                onChange={(e) => setNim(e.target.value)}
                                pattern={/^[0-9]*$/}
                                maxLength={9}
                                errorMessage="NIM hanya boleh berisi angka"
                                disabled={localLoading}
                            />
                        </div>

                        {/* Token field */}
                        <div style={{ marginBottom: 28 }}>
                            <label className="form-label">Kode Akses — 6 Karakter</label>
                            <ValidationInput
                                type="text"
                                placeholder="A1B2C3"
                                value={token}
                                onChange={(e) => setToken(e.target.value.toUpperCase())}
                                pattern={/^[A-Za-z0-9]*$/}
                                maxLength={6}
                                errorMessage="Karakter tidak valid"
                                disabled={localLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={localLoading}
                            style={{ width: '100%', padding: '14px', fontSize: 13 }}
                        >
                            {localLoading
                                ? <><LoadingSpinner /> &nbsp; Memverifikasi...</>
                                : '⬡ Masuk ke Bilik Suara'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div style={{
                        marginTop: 24,
                        paddingTop: 20,
                        borderTop: '1px solid rgba(200,150,12,0.1)',
                        textAlign: 'center',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 10, letterSpacing: '0.2em',
                            textTransform: 'uppercase',
                            color: 'rgba(200,170,120,0.25)',
                        }}>
                            Pemira 2026–2027 · Satu Suara, Satu Hak
                        </div>
                    </div>
                </div>

                {/* Note strip */}
                <div style={{
                    marginTop: 14,
                    padding: '10px 16px',
                    border: '1px solid rgba(200,150,12,0.1)',
                    borderRadius: 3,
                    background: 'rgba(8,5,2,0.6)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11,
                    letterSpacing: '0.08em',
                    color: 'rgba(200,170,120,0.35)',
                    textAlign: 'center',
                }}>
                    Setiap pemilih hanya dapat memberikan suara satu kali
                </div>
            </div>

            <style>{`
                @keyframes goldPulse {
                    0%,100% { text-shadow: 0 0 30px rgba(200,150,12,0.3); }
                    50%     { text-shadow: 0 0 50px rgba(232,184,0,0.5); }
                }
            `}</style>
        </div>
    );
}

export default VoterLogin;