import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
        window.location.href = '/';
    };

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    minHeight: '100vh',
                    background: 'var(--obsidian, #0D0A07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 24,
                }}>
                    <div style={{
                        maxWidth: 480, width: '100%',
                        background: 'linear-gradient(160deg, rgba(30,15,8,0.98), rgba(8,4,2,0.99))',
                        border: '1px solid rgba(180,40,40,0.4)',
                        borderRadius: 4,
                        padding: '44px 36px',
                        textAlign: 'center',
                        boxShadow: '0 32px 80px rgba(0,0,0,0.85)',
                        position: 'relative',
                    }}>
                        {/* Top accent */}
                        <div style={{
                            position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                            background: 'linear-gradient(90deg, transparent, rgba(192,57,43,0.8), transparent)',
                        }} />

                        {/* Icon */}
                        <div style={{
                            width: 56, height: 56, margin: '0 auto 20px',
                            border: '2px solid rgba(180,40,40,0.4)',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: 'rgba(180,40,40,0.08)',
                            fontFamily: 'monospace', fontSize: 22,
                            color: 'rgba(192,57,43,0.8)',
                        }}>
                            !
                        </div>

                        <div style={{
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: 10, letterSpacing: '0.3em',
                            textTransform: 'uppercase',
                            color: 'rgba(180,40,40,0.6)',
                            marginBottom: 10,
                        }}>
                            System Error
                        </div>

                        <div style={{
                            fontFamily: "'Rye', Georgia, serif",
                            fontSize: '1.6rem',
                            color: '#E8B800',
                            letterSpacing: '0.06em',
                            marginBottom: 16,
                        }}>
                            Terjadi Kesalahan
                        </div>

                        <div style={{
                            fontFamily: 'monospace',
                            fontSize: 12,
                            color: 'rgba(200,170,120,0.5)',
                            background: 'rgba(0,0,0,0.3)',
                            border: '1px solid rgba(200,150,12,0.08)',
                            borderRadius: 3,
                            padding: '12px 16px',
                            marginBottom: 24,
                            maxHeight: 80,
                            overflowY: 'auto',
                            textAlign: 'left',
                        }}>
                            {this.state.error?.message || 'Kesalahan tidak terduga'}
                        </div>

                        <div style={{
                            fontFamily: "'Oswald', sans-serif",
                            fontSize: 11, letterSpacing: '0.1em',
                            color: 'rgba(200,170,120,0.3)',
                            marginBottom: 24,
                        }}>
                            Tim admin telah diberitahu. Silakan coba lagi.
                        </div>

                        <button
                            onClick={this.handleReset}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                padding: '12px 32px',
                                background: 'linear-gradient(160deg, #7A3B1E, #4A1A0A)',
                                border: '1px solid rgba(200,150,12,0.25)',
                                borderRadius: 3,
                                fontFamily: "'Oswald', sans-serif",
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: '0.18em',
                                textTransform: 'uppercase',
                                color: '#D4A96A',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(200,150,12,0.5)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(200,150,12,0.25)'; }}
                        >
                            Kembali ke Halaman Utama
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

export default ErrorBoundary;