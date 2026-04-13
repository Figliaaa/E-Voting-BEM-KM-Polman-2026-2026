import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TumbleweedBackground } from '../components/ui/CommonComponents';

function LandingPage() {
    const navigate = useNavigate();

    return (
        <div className="app-container" style={{ alignItems: 'center', justifyContent: 'center' }}>
            <TumbleweedBackground />

            {/* Vignette */}
            <div style={{
                position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
                background: 'radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.75) 100%)',
            }} />

            {/* Horizontal scan line */}
            <div style={{
                position: 'fixed', left: 0, right: 0, height: 2, top: '-2px',
                background: 'linear-gradient(90deg, transparent, rgba(200,150,12,0.2), transparent)',
                animation: 'scanline 8s linear infinite',
                pointerEvents: 'none', zIndex: 3,
            }} />

            {/* Corner ornaments */}
            {['top:24px;left:24px', 'top:24px;right:24px', 'bottom:24px;left:24px', 'bottom:24px;right:24px'].map((pos, i) => {
                const s = Object.fromEntries(pos.split(';').map(p => p.split(':')));
                const corners = ['╔','╗','╚','╝'];
                return (
                    <div key={i} style={{
                        position: 'fixed', ...s,
                        fontFamily: 'monospace',
                        fontSize: 28,
                        color: 'rgba(200,150,12,0.25)',
                        lineHeight: 1,
                        zIndex: 2,
                        pointerEvents: 'none',
                    }}>
                        {corners[i]}
                    </div>
                );
            })}

            {/* Main content */}
            <div style={{
                position: 'relative', zIndex: 10,
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                padding: '40px 24px', maxWidth: 640, width: '100%',
                textAlign: 'center',
                animation: 'fadeInDown 0.9s ease both',
            }}>
                {/* Over-title */}
                <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 11, letterSpacing: '0.35em',
                    textTransform: 'uppercase',
                    color: 'var(--gold-dim)',
                    marginBottom: 20,
                    animation: 'fadeIn 1.2s ease 0.2s both',
                }}>
                    ── Komisi Pemilihan Raya ──
                </div>

                {/* Main title */}
                <div style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 'clamp(3.2rem, 10vw, 7rem)',
                    lineHeight: 1,
                    color: 'var(--gold-bright)',
                    letterSpacing: '0.06em',
                    textShadow: '0 0 60px rgba(200,150,12,0.35), 0 4px 32px rgba(0,0,0,0.8)',
                    animation: 'goldPulse 3s ease-in-out infinite, fadeInDown 0.9s ease both',
                    marginBottom: 8,
                }}>
                    PEMIRA
                </div>

                {/* Year badge */}
                <div style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 14, letterSpacing: '0.28em',
                    color: 'var(--sand)',
                    marginBottom: 32,
                    animation: 'fadeIn 1s ease 0.3s both',
                }}>
                    2026 — 2027
                </div>

                {/* Subtitle line */}
                <div style={{
                    fontFamily: 'var(--font-body)',
                    fontStyle: 'italic',
                    fontSize: 16,
                    color: 'rgba(200,170,120,0.55)',
                    marginBottom: 52,
                    animation: 'fadeIn 1s ease 0.4s both',
                    maxWidth: 380,
                    lineHeight: 1.7,
                }}>
                    Satu suara. Satu kesempatan.<br />
                    Pilih pemimpin frontier-mu.
                </div>

                {/* Divider */}
                <div style={{
                    width: '100%', height: 1,
                    background: 'linear-gradient(90deg, transparent, rgba(200,150,12,0.35), transparent)',
                    marginBottom: 48,
                    animation: 'fadeIn 1s ease 0.5s both',
                }} />

                {/* Buttons */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                    gap: 16, width: '100%', maxWidth: 520,
                    animation: 'fadeInUp 0.9s ease 0.5s both',
                }}>
                    <button
                        onClick={() => navigate('/login')}
                        className="btn btn-primary"
                        style={{ padding: '18px 24px', fontSize: 14 }}
                    >
                        ⬡ &nbsp; Lanjut Memilih
                    </button>
                </div>

                {/* Info strip */}
                <div style={{
                    marginTop: 44,
                    padding: '18px 24px',
                    border: '1px solid rgba(200,150,12,0.15)',
                    borderRadius: 4,
                    width: '100%',
                    background: 'rgba(10,7,3,0.5)',
                    animation: 'fadeInUp 0.9s ease 0.7s both',
                }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: 16,
                    }}>
                        {[
                            { icon: '⬡', text: 'Satu Suara Per Pemilih' },
                            { icon: '◈', text: 'Aman & Rahasia' },
                            { icon: '◉', text: 'Waktu Terbatas' },
                        ].map((item, i) => (
                            <div key={i} style={{ textAlign: 'center' }}>
                                <div style={{
                                    color: 'var(--gold-dim)',
                                    fontSize: 18, marginBottom: 6,
                                }}>{item.icon}</div>
                                <div style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 10, letterSpacing: '0.12em',
                                    textTransform: 'uppercase',
                                    color: 'rgba(200,170,120,0.45)',
                                    lineHeight: 1.4,
                                }}>{item.text}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer stamp */}
                <div style={{
                    marginTop: 36,
                    fontFamily: 'var(--font-heading)',
                    fontSize: 10, letterSpacing: '0.3em',
                    textTransform: 'uppercase',
                    color: 'rgba(200,170,120,0.2)',
                    animation: 'fadeIn 1s ease 0.9s both',
                }}>
                    Pemira System — Dark Frontier Edition
                </div>
            </div>

            <style>{`
                @keyframes scanline {
                    0%   { top: -2px; }
                    100% { top: 100vh; }
                }
                @keyframes goldPulse {
                    0%, 100% { text-shadow: 0 0 60px rgba(200,150,12,0.35), 0 4px 32px rgba(0,0,0,0.8); }
                    50%       { text-shadow: 0 0 80px rgba(232,184,0,0.55), 0 4px 32px rgba(0,0,0,0.8); }
                }
            `}</style>
        </div>
    );
}

export default LandingPage;