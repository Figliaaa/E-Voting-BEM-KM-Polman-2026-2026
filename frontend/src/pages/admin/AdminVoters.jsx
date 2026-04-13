import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { LoadingSpinner, Alert } from '../../components/ui/CommonComponents';

function AdminVoters() {
    const navigate      = useNavigate();
    const { adminAuth } = useAuth();
    const [loading, setLoading]             = useState(true);
    const [error, setError]                 = useState('');
    const [success, setSuccess]             = useState('');
    const [voters, setVoters]               = useState([]);
    const [currentPage, setCurrentPage]     = useState(1);
    const [searchTerm, setSearchTerm]       = useState('');
    const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
    const [loadingAction, setLoadingAction] = useState(false);
    const [showBulkUpload, setShowBulkUpload] = useState(false);
    const [bulkFile, setBulkFile]           = useState(null);
    const itemsPerPage = 20;
    const isInitialMount = useRef(true);

    const fetchVoters = useCallback(async (pageNum = 1, search = '') => {
        try {
            setLoading(true);
            const response = await adminAPI.getVoters(pageNum, itemsPerPage, search);
            const transformedVoters = response.data.voters.map(v => ({
                nim: v.nim,
                nama: v.nama,
                status_pilih: v.sudahMemilih ? 1 : 0,
                token_diambil: v.tokenDiambil ? 1 : 0,
                waktu_pilih: v.waktuMemilih
            }));
            setVoters(transformedVoters);
            setError('');
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal memuat data pemilih');
        } finally {
            setLoading(false);
        }
    }, [itemsPerPage]);

    useEffect(() => {
        if (!adminAuth?.token) { navigate('/admin/login'); return; }
        fetchVoters(1, '');
        isInitialMount.current = false;
    }, [adminAuth?.token, navigate, fetchVoters]);
    
    useEffect(() => {
        const searchTimer = setTimeout(() => {
            setDebouncedSearchTerm(searchTerm);
            setCurrentPage(1);
        }, 1000);
        
        return () => clearTimeout(searchTimer);
    }, [searchTerm]);
    
    useEffect(() => {
        if (isInitialMount.current) return;
        fetchVoters(currentPage, debouncedSearchTerm);
    }, [currentPage, debouncedSearchTerm, fetchVoters]);

    const handleActivateToken = async (nim) => {
        if (!window.confirm(`Aktifkan token untuk pemilih ${nim}?`)) return;
        setLoadingAction(true);
        try {
            await adminAPI.activateToken(nim);
            setSuccess(`Token berhasil diaktifkan untuk ${nim}`);
            await fetchVoters(currentPage, debouncedSearchTerm);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal mengaktifkan token');
        } finally {
            setLoadingAction(false);
        }
    };

    const handleBulkActivate = async (e) => {
        e.preventDefault();
        if (!bulkFile) { setError('Pilih file terlebih dahulu'); return; }
        setLoadingAction(true);
        try {
            const formData = new FormData();
            formData.append('file', bulkFile);
            await adminAPI.bulkActivateTokens(formData);
            setSuccess('Aktivasi massal berhasil');
            setBulkFile(null); setShowBulkUpload(false);
            setCurrentPage(1);
            await fetchVoters(1, debouncedSearchTerm);
            setTimeout(() => setSuccess(''), 3000);
        } catch (err) {
            setError(err.response?.data?.message || 'Gagal aktivasi massal');
        } finally {
            setLoadingAction(false);
        }
    };

    const getStatus = (v) => {
        if (v.status_pilih)  return { label: 'Sudah Memilih', cls: 'badge-voted' };
        if (v.token_diambil) return { label: 'Belum Memilih', cls: 'badge-pending' };
        return { label: 'Belum Aktif', cls: 'badge-inactive' };
    };

    if (!adminAuth?.token) return null;
    if (loading && voters.length === 0) return (
        <div className="loading-container" style={{ background: 'var(--obsidian)' }}>
            <LoadingSpinner /><div className="loading-text">Memuat pemilih...</div>
        </div>
    );

    return (
        <div style={{ minHeight: '100vh', background: 'var(--obsidian)', padding: '28px 20px' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
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
                            Manajemen Pemilih
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => navigate('/admin/dashboard')} className="btn btn-secondary" style={{ fontSize: 11, padding: '8px 14px' }}>
                            ← Kembali
                        </button>
                        <button
                            onClick={() => setShowBulkUpload(!showBulkUpload)}
                            className="btn btn-primary"
                            style={{ fontSize: 11, padding: '8px 14px' }}
                        >
                            {showBulkUpload ? '✕ Tutup' : '↑ Upload Massal'}
                        </button>
                    </div>
                </div>

                <Alert type="error"   message={error}   onClose={() => setError('')} />
                <Alert type="success" message={success} onClose={() => setSuccess('')} />

                {/* Bulk upload */}
                {showBulkUpload && (
                    <div className="form-panel" style={{ marginBottom: 24 }}>
                        <div style={{
                            fontFamily: 'var(--font-heading)', fontSize: 12,
                            letterSpacing: '0.18em', textTransform: 'uppercase',
                            color: 'var(--gold-dim)', marginBottom: 16,
                        }}>
                            Aktivasi Token Massal
                        </div>
                        <div style={{
                            border: '1px dashed rgba(200,150,12,0.2)',
                            borderRadius: 3, padding: 20,
                            marginBottom: 16, textAlign: 'center',
                        }}>
                            <div style={{
                                fontFamily: 'var(--font-heading)', fontSize: 11,
                                color: 'rgba(200,170,120,0.35)', marginBottom: 12,
                                letterSpacing: '0.1em',
                            }}>
                                Format CSV: satu NIM per baris, tanpa header
                            </div>
                            <input
                                type="file"
                                accept=".csv,.txt"
                                onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                                disabled={loadingAction}
                                style={{ color: 'var(--sand)' }}
                            />
                        </div>
                        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                            <button onClick={() => { setShowBulkUpload(false); setBulkFile(null); }} disabled={loadingAction} className="btn btn-secondary" style={{ fontSize: 11 }}>
                                Batalkan
                            </button>
                            <button onClick={handleBulkActivate} disabled={loadingAction || !bulkFile} className="btn btn-primary" style={{ fontSize: 11 }}>
                                {loadingAction ? <LoadingSpinner /> : 'Aktifkan Semua'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Search */}
                <div style={{ marginBottom: 20 }}>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Cari berdasarkan NIM atau nama..."
                        className="input-field"
                        style={{ maxWidth: 400 }}
                    />
                </div>

                {/* Table */}
                <div style={{
                    background: 'linear-gradient(160deg, rgba(22,15,8,0.96), rgba(8,5,2,0.98))',
                    border: '1px solid rgba(200,150,12,0.15)',
                    borderRadius: 4, overflow: 'hidden',
                    overflowX: 'auto',
                    animation: 'fadeInUp 0.5s ease',
                }}>
                    {voters.length === 0 ? (
                        <div style={{
                            padding: '48px', textAlign: 'center',
                            fontFamily: 'var(--font-heading)', fontSize: 12,
                            letterSpacing: '0.14em', textTransform: 'uppercase',
                            color: 'rgba(200,170,120,0.2)',
                        }}>
                            {searchTerm ? 'Tidak ditemukan' : 'Belum ada pemilih terdaftar'}
                        </div>
                    ) : (
                        <table className="frontier-table">
                            <thead>
                                <tr>
                                    <th>NIM</th>
                                    <th>Nama</th>
                                    <th style={{ textAlign: 'center' }}>Status</th>
                                    <th style={{ textAlign: 'center' }}>Token</th>
                                    <th style={{ textAlign: 'center' }}>Waktu Memilih</th>
                                    <th style={{ textAlign: 'right' }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voters.map((v, i) => {
                                    const status = getStatus(v);
                                    return (
                                        <tr key={v.nim}>
                                            <td style={{
                                                fontFamily: 'var(--font-heading)',
                                                fontWeight: 600, color: 'var(--sand)',
                                                fontSize: 13,
                                            }}>
                                                {v.nim}
                                            </td>
                                            <td style={{ color: 'var(--bone)' }}>{v.nama}</td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span className={`badge ${status.cls}`}>
                                                    {status.label}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                <span style={{
                                                    fontFamily: 'var(--font-heading)',
                                                    fontSize: 11,
                                                    color: v.token_diambil ? '#7FC8A0' : 'rgba(200,170,120,0.3)',
                                                }}>
                                                    {v.token_diambil ? '✓' : '—'}
                                                </span>
                                            </td>
                                            <td style={{ textAlign: 'center' }}>
                                                {v.status_pilih && v.waktu_pilih ? (
                                                    <span style={{
                                                        fontFamily: 'var(--font-heading)',
                                                        fontSize: 11, color: '#7FC8A0',
                                                    }}>
                                                        {new Date(v.waktu_pilih).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: 'rgba(200,170,120,0.2)', fontSize: 11 }}>—</span>
                                                )}
                                            </td>
                                            <td style={{ textAlign: 'right' }}>
                                                {!v.token_diambil && (
                                                    <button
                                                        onClick={() => handleActivateToken(v.nim)}
                                                        disabled={loadingAction}
                                                        className="btn btn-success"
                                                        style={{ fontSize: 10, padding: '6px 12px' }}
                                                    >
                                                        Aktifkan
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {voters.length > 0 && (
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1 || loading}
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '8px 14px' }}
                        >
                            ← Sebelumnya
                        </button>
                        <div className="pagination-info">Hal. {currentPage}</div>
                        <button
                            onClick={() => setCurrentPage(p => p + 1)}
                            disabled={voters.length < itemsPerPage || loading}
                            className="btn btn-secondary"
                            style={{ fontSize: 11, padding: '8px 14px' }}
                        >
                            Selanjutnya →
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default AdminVoters;