import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { LoadingSpinner, Alert } from '../../components/ui/CommonComponents';

function AdminCandidates() {
    const navigate       = useNavigate();
    const { adminAuth }  = useAuth();
    const [loading, setLoading]           = useState(true);
    const [error, setError]               = useState('');
    const [success, setSuccess]           = useState('');
    const [candidates, setCandidates]     = useState([]);
    const [showForm, setShowForm]         = useState(false);
    const [editingId, setEditingId]       = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const [formData, setFormData] = useState({ nama_ketua: '', nama_wakil: '', deskripsi: '', foto_url: '' });

    useEffect(() => {
        if (!adminAuth?.token) { navigate('/admin/login'); return; }
        fetchCandidates();
    }, [adminAuth?.token, navigate]);

    const fetchCandidates = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getCandidates();
            const candidatesArray = response?.data?.candidates || [];
            setCandidates(candidatesArray.sort((a, b) => a.id - b.id));
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat kandidat');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        if (!formData.nama_ketua.trim()) { setError('Nama ketua wajib diisi'); return; }
        if (!formData.nama_wakil.trim()) { setError('Nama wakil wajib diisi'); return; }
        if (!formData.deskripsi.trim())  { setError('Deskripsi wajib diisi');  return; }
        setLoadingAction(true);
        try {
            if (editingId) {
                await adminAPI.updateCandidate(editingId, formData);
                setSuccess('Kandidat berhasil diperbarui');
            } else {
                await adminAPI.addCandidate(formData);
                setSuccess('Kandidat berhasil ditambahkan');
            }
            setFormData({ nama_ketua: '', nama_wakil: '', deskripsi: '', foto_url: '' });
            setShowForm(false); setEditingId(null);
            await fetchCandidates();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Operasi gagal');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleEdit = (c) => {
        setFormData({ nama_ketua: c.nama_ketua, nama_wakil: c.nama_wakil, deskripsi: c.deskripsi, foto_url: c.foto_url || '' });
        setEditingId(c.id); setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Hapus kandidat ini?')) return;
        setLoadingAction(true);
        try {
            await adminAPI.deleteCandidate(id);
            setSuccess('Kandidat berhasil dihapus');
            await fetchCandidates();
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal menghapus');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleCancel = () => {
        setShowForm(false); setEditingId(null);
        setFormData({ nama_ketua: '', nama_wakil: '', deskripsi: '', foto_url: '' });
    };

    if (!adminAuth?.token) return null;
    if (loading) return (
        <div className="loading-container" style={{ background: 'var(--obsidian)' }}>
            <LoadingSpinner /><div className="loading-text">Memuat kandidat...</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--obsidian)', padding: '28px 20px' }}>
            <div style={{ maxWidth: 900, margin: '0 auto' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    alignItems: 'flex-end', marginBottom: 28,
                    borderBottom: '1px solid rgba(200,150,12,0.12)',
                    paddingBottom: 20, flexWrap: 'wrap', gap: 12,
                }}>
                    <div>
                        <div style={{
                            fontFamily: 'var(--font-heading)', fontSize: 10,
                            letterSpacing: '0.3em', textTransform: 'uppercase',
                            color: 'var(--gold-dim)', marginBottom: 6,
                        }}>Command Center</div>
                        <div style={{
                            fontFamily: 'var(--font-display)',
                            fontSize: 'clamp(1.3rem, 3.5vw, 1.9rem)',
                            color: 'var(--gold-bright)', letterSpacing: '0.06em',
                        }}>
                            Manajemen Kandidat
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary" style={{ fontSize: 11, padding: '8px 14px' }}>
                            ← Kembali
                        </button>
                        <button
                            onClick={() => { if (showForm) handleCancel(); else setShowForm(true); }}
                            className={showForm ? 'btn btn-danger' : 'btn btn-primary'}
                            style={{ fontSize: 11, padding: '8px 14px' }}
                        >
                            {showForm ? '✕ Tutup' : '+ Tambah Kandidat'}
                        </button>
                    </div>
                </div>

                <Alert type="error"   message={error}   onClose={() => setError('')} />
                <Alert type="success" message={success} onClose={() => setSuccess('')} />

                {/* Form */}
                {showForm && (
                    <div className="form-panel" style={{ marginBottom: 24 }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)', fontSize: 12,
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            color: 'var(--gold-dim)', marginBottom: 20,
                        }}>
                            {editingId ? 'Edit Kandidat' : 'Tambah Kandidat Baru'}
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                                gap: 16, marginBottom: 16,
                            }}>
                                {[
                                    { name: 'nama_ketua', label: 'Nama Ketua', placeholder: 'Nama lengkap ketua' },
                                    { name: 'nama_wakil', label: 'Nama Wakil', placeholder: 'Nama lengkap wakil' },
                                    { name: 'foto_url',   label: 'URL Foto (opsional)', placeholder: 'https://...' },
                                ].map(f => (
                                    <div key={f.name}>
                                        <label className="form-label">{f.label}</label>
                                        <input
                                            type="text"
                                            name={f.name}
                                            value={formData[f.name]}
                                            onChange={e => setFormData(p => ({ ...p, [f.name]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            disabled={loadingAction}
                                            className="input-field"
                                        />
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginBottom: 20 }}>
                                <label className="form-label">Deskripsi / Visi Misi</label>
                                <textarea
                                    name="deskripsi"
                                    value={formData.deskripsi}
                                    onChange={e => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
                                    placeholder="Jelaskan visi, misi, dan program kerja..."
                                    disabled={loadingAction}
                                    rows={5}
                                    className="input-field"
                                    style={{ resize: 'vertical' }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                                <button type="button" onClick={handleCancel} disabled={loadingAction} className="btn btn-secondary" style={{ fontSize: 12 }}>
                                    Batalkan
                                </button>
                                <button type="submit" disabled={loadingAction} className="btn btn-primary" style={{ fontSize: 12 }}>
                                    {loadingAction ? <LoadingSpinner /> : editingId ? 'Simpan Perubahan' : 'Tambah Kandidat'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Candidate list */}
                {candidates.length === 0 ? (
                    <div style={{
                        padding: '48px', textAlign: 'center',
                        border: '1px dashed rgba(200,150,12,0.12)', borderRadius: 4,
                        fontFamily: 'var(--font-heading)', fontSize: 12,
                        letterSpacing: '0.14em', textTransform: 'uppercase',
                        color: 'rgba(200,170,120,0.25)',
                    }}>
                        Belum ada kandidat — tambahkan kandidat pertama
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {candidates.map((c, i) => (
                            <div
                                key={c.id}
                                className="frontier-card"
                                style={{
                                    display: 'grid',
                                    gridTemplateColumns: '56px 1fr auto',
                                    gap: 20, alignItems: 'start',
                                    animation: `fadeInUp 0.4s ease ${i * 0.06}s both`,
                                }}
                            >
                                {/* ID badge */}
                                <div style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: '1.6rem', color: 'var(--gold-dim)',
                                    textAlign: 'center', paddingTop: 4,
                                }}>
                                    #{c.id}
                                </div>

                                {/* Info */}
                                <div>
                                    <div style={{
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: 15, fontWeight: 600,
                                        color: 'var(--bone)', marginBottom: 3,
                                    }}>
                                        {c.nama_ketua}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-body)',
                                        fontStyle: 'italic', fontSize: 12,
                                        color: 'rgba(200,170,120,0.45)', marginBottom: 8,
                                    }}>
                                        & {c.nama_wakil}
                                    </div>
                                    <div style={{
                                        fontFamily: 'var(--font-body)',
                                        fontStyle: 'italic', fontSize: 12,
                                        color: 'rgba(200,170,120,0.35)',
                                        lineHeight: 1.6,
                                        display: '-webkit-box',
                                        WebkitLineClamp: 2,
                                        WebkitBoxOrient: 'vertical',
                                        overflow: 'hidden',
                                    }}>
                                        {c.deskripsi}
                                    </div>
                                    <div style={{
                                        marginTop: 10,
                                        fontFamily: 'var(--font-heading)',
                                        fontSize: 11, letterSpacing: '0.1em',
                                        color: 'rgba(200,170,120,0.3)',
                                    }}>
                                        {c.jumlah_suara} suara
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 100 }}>
                                    <button
                                        onClick={() => handleEdit(c)}
                                        disabled={loadingAction}
                                        className="btn btn-secondary"
                                        style={{ fontSize: 11, padding: '8px 12px' }}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        onClick={() => handleDelete(c.id)}
                                        disabled={loadingAction}
                                        className="btn btn-danger"
                                        style={{ fontSize: 11, padding: '8px 12px' }}
                                    >
                                        Hapus
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminCandidates;