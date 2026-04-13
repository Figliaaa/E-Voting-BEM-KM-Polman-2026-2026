import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { voterAPI, publicAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { onScoresUpdate, offScoresUpdate, initSocket } from '../../services/socket';
import { LoadingSpinner, Alert, TumbleweedBackground } from '../../components/ui/CommonComponents';

function VotingPage() {
    const navigate      = useNavigate();
    const { voterAuth } = useAuth();
    const [candidates, setCandidates] = useState([]);
    const [selected, setSelected]     = useState(null);
    const [loading, setLoading]       = useState(true);
    const [voting, setVoting]         = useState(false);
    const [error, setError]           = useState('');
    const [success, setSuccess]       = useState('');
    const [confirmed, setConfirmed]   = useState(false);   // confirm dialog state
    const totalVotes = candidates.reduce((s, c) => s + (c.jumlah_suara || 0), 0);

    useEffect(() => {
        if (!voterAuth) { navigate('/login'); return; }
        fetchCandidates();
        initSocket();
        const handleUpdate = (scores) => {
            setCandidates(prev =>
                prev.map(c => {
                    const u = scores.find(s => s.id === c.id);
                    return u ? { ...c, jumlah_suara: u.jumlah_suara } : c;
                })
            );
        };
        onScoresUpdate(handleUpdate);
        return () => offScoresUpdate(handleUpdate);
    }, [voterAuth, navigate]);

    const fetchCandidates = async () => {
        try {
            const res = await publicAPI.getCandidates();
            setCandidates(res.data.candidates);
        } catch {
            setError('Gagal memuat data kandidat');
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async () => {
        if (!selected) { setError('Pilih kandidat terlebih dahulu'); return; }
        setVoting(true);
        setError('');
        try {
            const res = await voterAPI.vote(selected);
            if (res.data.success) {
                setSuccess('Suara berhasil direkam');
                setTimeout(() => navigate('/success'), 1800);
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memproses suara');
        } finally {
            setVoting(false);
            setConfirmed(false);
        }
    };

    if (loading) return (
        <div className="loading-container" style={{ background: 'var(--obsidian)' }}>
            <LoadingSpinner />
            <div className="loading-text">Memuat kandidat...</div>
        </div>
    );

    return (
        <div className="app-container">
            <TumbleweedBackground />

            {/* Confirm overlay */}
            {confirmed && (
                <div style={{
                    position: 'fixed', inset: 0, zIndex: 100,
                    background: 'rgba(0,0,0,0.85)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: '20px',
                    animation: 'fadeIn 0.2s ease',
                }}>
                    <div style={{
                        background: 'linear-gradient(160deg, rgba(35,22,10,0.98), rgba(12,8,3,0.99))',
                        border: '1px solid rgba(200,150,12,0.35)',
                        borderRadius: 4,
                        padding: 'clamp(24px, 8vw, 36px) clamp(20px, 6vw, 32px)',
                        maxWidth: 'clamp(320px, 90vw, 380px)',
                        width: '100%',
                        textAlign: 'center',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.9)',
                    }}>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: '1.4rem',
                            color: 'var(--gold-bright)',
                            marginBottom: 10,
                        }}>
                            Konfirmasi Pilihan
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 13, color: 'var(--sand)',
                            marginBottom: 8,
                        }}>
                            {candidates.find(c => c.id === selected)?.nama_ketua}
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-body)',
                            fontStyle: 'italic', fontSize: 12,
                            color: 'rgba(200,170,120,0.5)',
                            marginBottom: 28,
                        }}>
                            Suara tidak dapat diubah setelah dikonfirmasi
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                            <button
                                onClick={() => setConfirmed(false)}
                                className="btn btn-secondary"
                                style={{ flex: 1 }}
                                disabled={voting}
                            >
                                Batalkan
                            </button>
                            <button
                                onClick={handleVote}
                                className="btn btn-primary"
                                style={{ flex: 1 }}
                                disabled={voting}
                            >
                                {voting ? <LoadingSpinner /> : 'Ya, Konfirmasi'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div style={{
                maxWidth: 1100, margin: '0 auto', padding: '32px 20px', width: '100%',
            }}>
                {/* Header */}
                <div style={{
                    borderBottom: '1px solid rgba(200,150,12,0.15)',
                    paddingBottom: 'clamp(16px, 4vw, 24px)', 
                    marginBottom: 'clamp(20px, 5vw, 32px)',
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-end', flexWrap: 'wrap', gap: 12,
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(8px, 2vw, 10px)', 
                            letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: 'var(--gold-dim)',
                            marginBottom: 8,
                        }}>
                            Pemilihan Raya BEM 2026–2027
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.4rem, 4vw, 2.2rem)',
                            color: 'var(--gold-bright)',
                            letterSpacing: '0.06em',
                        }}>
                            Pilih Pemimpin
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(8px, 2vw, 10px)', 
                            letterSpacing: '0.15em',
                            textTransform: 'uppercase',
                            color: 'rgba(200,170,120,0.35)',
                        }}>
                            Pemilih
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(11px, 3vw, 13px)', 
                            color: 'var(--sand)',
                        }}>
                            {voterAuth?.name}
                        </div>
                    </div>
                </div>

                <Alert type="error"   message={error}   onClose={() => setError('')} />
                <Alert type="success" message={success} onClose={() => setSuccess('')} />

                {/* Candidates grid - Mobile first */}
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
                    gap: 'clamp(12px, 4vw, 20px)', 
                    marginBottom: 'clamp(24px, 6vw, 36px)',
                }}>
                    {candidates.map((c) => {
                        const pct = totalVotes > 0 ? ((c.jumlah_suara / totalVotes) * 100).toFixed(1) : 0;
                        const isSelected = selected === c.id;
                        return (
                            <div
                                key={c.id}
                                onClick={() => setSelected(c.id)}
                                className={`candidate-card ${isSelected ? 'selected' : ''}`}
                            >
                                {/* Candidate number */}
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 'clamp(9px, 2.5vw, 11px)',
                                    letterSpacing: '0.2em',
                                    textTransform: 'uppercase',
                                    color: isSelected ? 'var(--gold)' : 'var(--gold-dim)',
                                    marginBottom: 14,
                                }}>
                                    Kandidat #{c.id}
                                </div>

                                {/* Photo or placeholder */}
                                {c.foto_url ? (
                                    <img
                                        src={c.foto_url}
                                        alt={c.nama_ketua}
                                        style={{
                                            width: '100%', height: 'clamp(120px, 40vw, 180px)',
                                            objectFit: 'cover', borderRadius: 3,
                                            marginBottom: 16,
                                            border: '1px solid rgba(200,150,12,0.15)',
                                            filter: isSelected ? 'none' : 'brightness(0.8)',
                                            transition: 'filter 0.25s',
                                        }}
                                    />
                                ) : (
                                    <div style={{
                                        width: '100%', height: 'clamp(100px, 30vw, 120px)',
                                        background: 'rgba(200,150,12,0.04)',
                                        border: '1px dashed rgba(200,150,12,0.15)',
                                        borderRadius: 3, marginBottom: 16,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'var(--font-heading)', fontSize: 'clamp(8px, 2vw, 10px)',
                                        letterSpacing: '0.2em', textTransform: 'uppercase',
                                        color: 'rgba(200,150,12,0.2)',
                                    }}>
                                        Foto tidak tersedia
                                    </div>
                                )}

                                {/* Names */}
                                <div style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 'clamp(14px, 3.5vw, 17px)',
                                    fontWeight: 700,
                                    color: isSelected ? 'var(--gold-bright)' : 'var(--bone)',
                                    letterSpacing: '0.04em',
                                    marginBottom: 4,
                                    transition: 'color 0.25s',
                                }}>
                                    {c.nama_ketua}
                                </div>
                                <div style={{
                                    fontFamily: 'var(--font-body)',
                                    fontStyle: 'italic',
                                    fontSize: 'clamp(11px, 2.5vw, 13px)',
                                    color: 'rgba(200,170,120,0.5)',
                                    marginBottom: 14,
                                }}>
                                    &amp; {c.nama_wakil}
                                </div>

                                {/* Description */}
                                {c.deskripsi && (
                                    <div style={{
                                        fontFamily: 'var(--font-body)',
                                        fontSize: 'clamp(10px, 2.2vw, 12px)',
                                        fontStyle: 'italic',
                                        color: 'rgba(200,170,120,0.4)',
                                        borderLeft: '2px solid rgba(200,150,12,0.25)',
                                        paddingLeft: 10, marginBottom: 16,
                                        lineHeight: 1.6,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 3,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        "{c.deskripsi}"
                                    </div>
                                )}
                                

                                {/* Selected indicator */}
                                {isSelected && (
                                    <div style={{
                                        position: 'absolute', top: 12, right: 12,
                                        width: 24, height: 24, borderRadius: '50%',
                                        background: 'var(--gold)',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: 12, fontWeight: 700,
                                        color: 'var(--obsidian)',
                                        boxShadow: '0 0 12px rgba(200,150,12,0.5)',
                                    }}>
                                        ✓
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Vote submit */}
                <div style={{
                    borderTop: '1px solid rgba(200,150,12,0.12)',
                    paddingTop: 28,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
                }}>
                    {selected && (
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 'clamp(10px, 2.5vw, 11px)',
                            letterSpacing: '0.14em',
                            textTransform: 'uppercase',
                            color: 'var(--gold-dim)',
                            marginBottom: 4,
                        }}>
                            Dipilih: {candidates.find(c => c.id === selected)?.nama_ketua}
                        </div>
                    )}
                    <button
                        onClick={() => {
                            if (!selected) { setError('Pilih kandidat terlebih dahulu'); return; }
                            setConfirmed(true);
                        }}
                        disabled={voting || !selected}
                        className="btn btn-success"
                        style={{ padding: 'clamp(12px, 3vw, 15px) clamp(32px, 6vw, 48px)', fontSize: 'clamp(12px, 3vw, 14px)', letterSpacing: '0.16em' }}
                    >
                        {voting ? <><LoadingSpinner />&nbsp; Memproses...</> : '◈ Kirim Suara'}
                    </button>
                    <div style={{
                        fontFamily: 'var(--font-body)',
                        fontStyle: 'italic', fontSize: 12,
                        color: 'rgba(200,170,120,0.3)',
                    }}>
                        Suara tidak dapat diubah setelah dikirim
                    </div>
                </div>
            </div>
        </div>
    );
}

export default VotingPage;