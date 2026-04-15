import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { onScoresUpdate, emitAdminConnect } from '../../services/socket';
import { LoadingSpinner, Alert, WesternTitle } from '../../components/ui/CommonComponents';
import VotesPieChart from '../../components/VotesPieChart';

const TABS = [
    { id: 'overview',    label: 'Ikhtisar' },
    { id: 'candidates',  label: 'Kandidat' },
    { id: 'navigate',   label: 'Navigasi' },
];

function AdminDashboard() {
    const navigate = useNavigate();
    const { adminAuth, logout } = useAuth();
    const [loading, setLoading]       = useState(true);
    const [error, setError]           = useState('');
    const [stats, setStats]           = useState(null);
    const [candidates, setCandidates] = useState([]);
    const [activeTab, setActiveTab]   = useState('overview');

    useEffect(() => {
        if (!adminAuth?.token) { navigate('/admin/login'); return; }
        emitAdminConnect();
        fetchDashboardData();
        const handleUpdate = (scores) => {
            setCandidates(prev =>
                prev.map(c => {
                    const u = scores.find(s => s.id === c.id);
                    return u ? { ...c, jumlah_suara: u.jumlah_suara } : c;
                })
            );
        };
        onScoresUpdate(handleUpdate);
    }, [adminAuth?.token, navigate]);

    const fetchDashboardData = async () => {
        try {
            setLoading(true);
            const [statsResponse, candidatesResponse] = await Promise.all([
                adminAPI.getStatistics(),
                adminAPI.getCandidates(),
            ]);
            
            const statsData = {
                total_voters: 0,
                voted: 0,
                token_activated: 0
            };
            
            if (statsResponse?.data?.statistics?.tokenStatus) {
                statsResponse.data.statistics.tokenStatus.forEach(item => {
                    if (item.status.includes('Memilih')) {
                        statsData.voted += item.count;
                    }
                    if (item.status.includes('Token')) {
                        statsData.token_activated += item.count;
                    }
                });
                statsData.total_voters = statsResponse.data.statistics.tokenStatus.reduce((sum, item) => sum + item.count, 0);
            }
            
            setStats(statsData);
            const candidatesArray = candidatesResponse?.data?.candidates || [];
            setCandidates(candidatesArray.sort((a, b) => b.jumlah_suara - a.jumlah_suara));
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data dashboard');
        } finally {
            setLoading(false);
        }
    };

    const handleLogout = () => { logout(); navigate('/admin/login'); };

    if (!adminAuth?.token) return null;
    if (loading) return (
        <div className="loading-container" style={{ background: 'var(--obsidian)' }}>
            <LoadingSpinner /><div className="loading-text">Memuat data...</div>
        </div>
    );

    const totalVotes    = candidates.reduce((s, c) => s + (c.jumlah_suara || 0), 0);
    const participation = stats
        ? stats.total_voters > 0
            ? ((stats.voted / stats.total_voters) * 100).toFixed(1)
            : 0
        : 0;

    const statCards = [
        { label: 'Total Suara',      value: totalVotes,                      accent: 'var(--gold-bright)', border: 'rgba(200,150,12,0.3)' },
        { label: 'Tingkat Partisipasi', value: `${participation}%`,          accent: '#7FC8A0',            border: 'rgba(80,160,80,0.3)' },
        { label: 'Token Aktif',      value: stats?.token_activated ?? 0,     accent: '#7AACDB',            border: 'rgba(60,120,180,0.3)' },
        { label: 'Belum Memilih',    value: (stats?.token_activated ?? 0) - (stats?.voted ?? 0), accent: 'var(--ember)', border: 'rgba(180,40,40,0.3)' },
    ];

    return (
        <div style={{
            minHeight: '100vh',
            background: `
                radial-gradient(ellipse at 20% 0%, rgba(60,30,10,0.3) 0%, transparent 45%),
                var(--obsidian)
            `,
            padding: '28px 20px',
        }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                {/* Top bar */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-end', marginBottom: 32,
                    borderBottom: '1px solid rgba(200,150,12,0.12)',
                    paddingBottom: 20, flexWrap: 'wrap', gap: 12,
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 10, letterSpacing: '0.3em',
                            textTransform: 'uppercase', color: 'var(--gold-dim)',
                            marginBottom: 6,
                        }}>
                            Command Center
                        </div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.4rem, 4vw, 2.1rem)',
                            color: 'var(--gold-bright)', letterSpacing: '0.06em',
                        }}>
                            Admin Dashboard
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)',
                            fontSize: 11, letterSpacing: '0.1em',
                            color: 'rgba(200,170,120,0.4)',
                        }}>
                            {adminAuth.full_name || adminAuth.username}
                        </div>
                        <button
                            onClick={fetchDashboardData}
                            className="btn btn-secondary"
                            style={{ padding: '8px 14px', fontSize: 11 }}
                        >
                            ↻ Refresh
                        </button>
                        <button
                            onClick={handleLogout}
                            className="btn btn-danger"
                            style={{ padding: '8px 14px', fontSize: 11 }}
                        >
                            Keluar
                        </button>
                    </div>
                </div>

                <Alert type="error" message={error} onClose={() => setError('')} />

                {/* Tabs */}
                <div className="tab-bar">
                    {TABS.map(t => (
                        <button
                            key={t.id}
                            className={`tab-btn ${activeTab === t.id ? 'active' : ''}`}
                            onClick={() => setActiveTab(t.id)}
                        >
                            {t.label}
                        </button>
                    ))}
                </div>

                {/* Overview tab */}
                {activeTab === 'overview' && (
                    <div>
                        {/* Stat cards */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: 16, marginBottom: 32,
                        }}>
                            {statCards.map((s, i) => (
                                <div
                                    key={i}
                                    className="stat-card"
                                    style={{
                                        '--stat-accent': s.accent,
                                        borderColor: s.border,
                                        animation: `fadeInDown 0.5s ease ${i * 0.08}s both`,
                                    }}
                                >
                                    <div className="stat-label">{s.label}</div>
                                    <div className="stat-value">{s.value}</div>
                                </div>
                            ))}
                        </div>

                        {/* Sub info */}
                        <div style={{
                            padding: '16px 20px',
                            background: 'rgba(10,7,3,0.5)',
                            border: '1px solid rgba(200,150,12,0.1)',
                            borderRadius: 4,
                            fontFamily: 'var(--font-heading)',
                            fontSize: 12, letterSpacing: '0.08em',
                            color: 'rgba(200,170,120,0.4)',
                        }}>
                            Total pemilih terdaftar: <span style={{ color: 'var(--sand)' }}>{stats?.total_voters ?? 0}</span>
                            &nbsp;·&nbsp;
                            Sudah memilih: <span style={{ color: 'var(--sand)' }}>{stats?.voted ?? 0}</span>
                        </div>
                    </div>
                )}

                {/* Candidates tab */}
                {activeTab === 'candidates' && (
                    <div>
                        <div className="section-heading">Papan Peringkat Kandidat</div>
                        
                        {/* Pie Chart Overview */}
                        <div style={{
                            background: 'rgba(10,7,3,0.4)',
                            border: '1px solid rgba(200,150,12,0.15)',
                            borderRadius: 8,
                            padding: '24px',
                            marginBottom: '28px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minHeight: 240,
                            animation: 'fadeInUp 0.5s ease'
                        }}>
                            <VotesPieChart candidates={candidates} totalVotes={totalVotes} size={220} />
                        </div>

                        {/* Detailed Rankings */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {candidates.map((c, i) => {
                                const pct = totalVotes > 0 ? ((c.jumlah_suara / totalVotes) * 100).toFixed(1) : 0;
                                return (
                                    <div
                                        key={c.id}
                                        className={`leaderboard-row ${i === 0 ? 'rank-1' : ''}`}
                                        style={{ animation: `fadeInUp 0.4s ease ${i * 0.07}s both` }}
                                    >
                                        {/* Rank */}
                                        <div style={{
                                            fontFamily: 'var(--font-display)',
                                            fontSize: i === 0 ? '1.6rem' : '1.1rem',
                                            color: i === 0 ? 'var(--gold-bright)' : 'var(--gold-dim)',
                                            minWidth: 48, textAlign: 'center',
                                        }}>
                                            {i === 0 ? '①' : `#${i + 1}`}
                                        </div>

                                        {/* Info */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: 14, fontWeight: 600,
                                                color: i === 0 ? 'var(--gold-bright)' : 'var(--bone)',
                                                marginBottom: 2,
                                            }}>
                                                {c.nama_ketua}
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--font-body)',
                                                fontStyle: 'italic', fontSize: 12,
                                                color: 'rgba(200,170,120,0.4)',
                                            }}>
                                                & {c.nama_wakil}
                                            </div>
                                        </div>

                                        {/* Vote count */}
                                        <div style={{ textAlign: 'right' }}>
                                            <div style={{
                                                fontFamily: 'var(--font-display)',
                                                fontSize: '1.6rem',
                                                color: i === 0 ? 'var(--gold-bright)' : 'var(--sand)',
                                            }}>
                                                {c.jumlah_suara}
                                            </div>
                                            <div style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontSize: 10, letterSpacing: '0.14em',
                                                textTransform: 'uppercase',
                                                color: 'rgba(200,170,120,0.3)',
                                            }}>
                                                {pct}%
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            {candidates.length === 0 && (
                                <div style={{
                                    padding: '40px', textAlign: 'center',
                                    fontFamily: 'var(--font-heading)', fontSize: 12,
                                    letterSpacing: '0.14em', textTransform: 'uppercase',
                                    color: 'rgba(200,170,120,0.25)',
                                    border: '1px dashed rgba(200,150,12,0.1)', borderRadius: 4,
                                }}>
                                    Belum ada kandidat terdaftar
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Navigate tab */}
                {activeTab === 'navigate' && (
                    <div>
                        <div className="section-heading">Panel Manajemen</div>
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                            gap: 16,
                        }}>
                            {[
                                { label: 'Kelola Kandidat', desc: 'Tambah, ubah, atau hapus kandidat', path: '/admin/candidates', btn: 'btn-secondary' },
                                { label: 'Kelola Pemilih',  desc: 'Aktifkan token dan kelola data pemilih', path: '/admin/voters', btn: 'btn-secondary' },
                                { label: 'Refresh Data',    desc: 'Perbarui semua data dashboard', path: null, btn: 'btn-success' },
                            ].map((item, i) => (
                                <div
                                    key={i}
                                    className="frontier-card"
                                    style={{ animation: `fadeInUp 0.4s ease ${i * 0.08}s both` }}
                                >
                                    <div style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: 13, fontWeight: 600,
                                        color: 'var(--bone)', marginBottom: 6,
                                    }}>
                                        {item.label}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-body)',
                                        fontStyle: 'italic', fontSize: 12,
                                        color: 'rgba(200,170,120,0.35)',
                                        marginBottom: 18,
                                    }}>
                                        {item.desc}
                                    </div>
                                    <button
                                        className={`btn ${item.btn}`}
                                        style={{ width: '100%', fontSize: 12 }}
                                        onClick={() => item.path ? navigate(item.path) : fetchDashboardData()}
                                    >
                                        {item.label}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminDashboard;