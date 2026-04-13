import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

function VotingSuccess() {
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div style={{
            minHeight: '100vh',
            background: `
                radial-gradient(ellipse at 50% 0%,   rgba(50,30,8,0.6)  0%, transparent 55%),
                radial-gradient(ellipse at 50% 100%, rgba(60,15,10,0.4)  0%, transparent 55%),
                var(--obsidian)
            `,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Corner ornaments */}
            {[
                { top: 24, left: 24,  char: '╔' },
                { top: 24, right: 24, char: '╗' },
                { bottom: 24, left: 24,  char: '╚' },
                { bottom: 24, right: 24, char: '╝' },
            ].map((o, i) => {
                const { char, ...pos } = o;
                return (
                    <div key={i} style={{
                        position: 'fixed', ...pos,
                        fontFamily: 'monospace', fontSize: 24,
                        color: 'rgba(200,150,12,0.2)',
                        lineHeight: 1, pointerEvents: 'none',
                    }}>
                        {char}
                    </div>
                );
            })}

            {/* Main card */}
            <div style={{
                maxWidth: 480, width: '100%',
                background: 'linear-gradient(160deg, rgba(28,20,10,0.98), rgba(8,5,2,0.99))',
                border: '1px solid rgba(200,150,12,0.3)',
                borderRadius: 4,
                padding: 'clamp(32px, 8vw, 52px) clamp(24px, 6vw, 40px)',
                textAlign: 'center',
                boxShadow: '0 40px 100px rgba(0,0,0,0.85), 0 0 60px rgba(200,150,12,0.06)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'fadeInUp 0.8s ease',
            }}>
                {/* Top accent */}
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                    background: 'linear-gradient(90deg, transparent, var(--gold), transparent)',
                }} />

                {/* Inner frame */}
                <div style={{
                    position: 'absolute', inset: 10,
                    border: '1px dashed rgba(200,150,12,0.08)',
                    borderRadius: 2, pointerEvents: 'none',
                }} />

                {/* Seal */}
                <div style={{
                    width: 'clamp(56px, 12vw, 72px)', 
                    height: 'clamp(56px, 12vw, 72px)', 
                    margin: '0 auto clamp(16px, 4vw, 24px)',
                    border: '2px solid rgba(200,150,12,0.4)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(200,150,12,0.06)',
                    animation: 'goldPulse 2.5s ease-in-out infinite',
                }}>
                    <div style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 'clamp(20px, 5vw, 28px)', 
                        color: 'var(--gold-bright)',
                    }}>
                        ✦
                    </div>
                </div>

                {/* Title */}
                <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(8px, 2vw, 10px)', 
                    letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: 'rgba(45,160,35,0.7)',
                    marginBottom: 'clamp(8px, 2vw, 12px)',
                }}>
                    ── Suara Diterima ──
                </div>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(1.8rem, 5vw, 3rem)',
                    color: 'var(--gold-bright)',
                    letterSpacing: '0.06em',
                    textShadow: '0 0 40px rgba(200,150,12,0.4)',
                    marginBottom: 'clamp(16px, 4vw, 20px)',
                    animation: 'goldPulse 2s ease-in-out infinite',
                }}>
                    Terima Kasih
                </div>

                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic', 
                    fontSize: 'clamp(12px, 3vw, 14px)',
                    color: 'rgba(200,170,120,0.55)',
                    lineHeight: 1.8, 
                    marginBottom: 'clamp(24px, 6vw, 36px)',
                }}>
                    Suaramu telah tercatat dalam sistem.<br />
                    Partisipasimu menentukan masa depan organisasi.
                </div>

                {/* Divider */}
                <div style={{
                    height: 1, width: '60%', margin: `0 auto clamp(20px, 5vw, 32px)`,
                    background: 'linear-gradient(90deg, transparent, rgba(200,150,12,0.25), transparent)',
                }} />

                {/* Countdown */}
                <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 'clamp(9px, 2.2vw, 11px)', 
                    letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,170,120,0.3)',
                    marginBottom: 'clamp(6px, 1.5vw, 8px)',
                }}>
                    Kembali ke halaman utama dalam
                </div>
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(2rem, 10vw, 3.5rem)',
                    color: countdown <= 2 ? 'var(--ember)' : 'var(--gold-dim)',
                    lineHeight: 1,
                    marginBottom: 'clamp(20px, 5vw, 28px)',
                    transition: 'color 0.3s',
                }}>
                    {countdown}
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="btn btn-secondary"
                    style={{ padding: '12px 36px', fontSize: 12 }}
                >
                    Kembali Sekarang
                </button>

                {/* Footer */}
                <div style={{
                    marginTop: 28,
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10, letterSpacing: '0.2em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,170,120,0.18)',
                }}>
                    Pemira 2026–2027 · Dark Frontier Edition
                </div>
            </div>

            <style>{`
                @keyframes goldPulse {
                    0%,100% { text-shadow: 0 0 40px rgba(200,150,12,0.4); }
                    50%     { text-shadow: 0 0 60px rgba(232,184,0,0.65); }
                }
            `}</style>
        </div>
    );
}

export default VotingSuccess;