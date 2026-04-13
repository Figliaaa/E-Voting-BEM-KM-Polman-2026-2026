import React, { useEffect, useState } from 'react';

export function LoadingSpinner({ fullscreen = false, text = 'Loading...' }) {
    if (fullscreen) {
        return (
            <div className="loading-container">
                <div className="spinner" />
                <div className="loading-text">{text}</div>
            </div>
        );
    }
    return <span className="spinner" style={{ width: 20, height: 20, borderWidth: 2 }} />;
}

export function Alert({ type = 'info', message, onClose }) {
    if (!message) return null;
    const icons = {
        success: '✓',
        error:   '✕',
        warning: '⚠',
        info:    'ℹ',
    };
    return (
        <div className={`alert alert-${type}`}>
            <span style={{ fontFamily: 'var(--font-heading)', fontWeight: 700, fontSize: 14 }}>
                {icons[type]}
            </span>
            <span style={{ flex: 1 }}>{message}</span>
            {onClose && (
                <button className="alert-close" onClick={onClose} aria-label="Close">×</button>
            )}
        </div>
    );
}

export function WesternTitle({ level = 1, children, style = {} }) {
    const Tag = `h${level}`;
    return (
        <Tag
            className={`western-title western-title-h${level}`}
            style={{ textAlign: 'center', ...style }}
        >
            {children}
        </Tag>
    );
}

export function TumbleweedBackground() {
    const [weeds, setWeeds] = useState([]);

    useEffect(() => {
        let id = 0;
        const spawn = () => {
            const weed = {
                id: id++,
                top: 60 + Math.random() * 30,         
                duration: 14 + Math.random() * 12,      
                delay: Math.random() * 4,
                size: 1.4 + Math.random() * 1.2,
                symbol: ['🌾', '🪨', '🌿', '🌵', '🐎'][Math.floor(Math.random() * 6)],
            };
            setWeeds(prev => [...prev.slice(-4), weed]);
        };
        spawn();
        const interval = setInterval(spawn, 8000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            {weeds.map(w => (
                <div
                    key={w.id}
                    className="tumbleweed"
                    style={{
                        top: `${w.top}%`,
                        animationDuration: `${w.duration}s`,
                        animationDelay: `${w.delay}s`,
                        fontSize: `${w.size}rem`,
                    }}
                >
                    {w.symbol}
                </div>
            ))}
        </>
    );
}

export function ValidationInput({
    type = 'text',
    placeholder,
    value,
    onChange,
    pattern,
    maxLength,
    errorMessage,
    disabled,
    style = {},
}) {
    const [touched, setTouched] = useState(false);
    const isInvalid = touched && pattern && !pattern.test(value) && value.length > 0;

    const handleChange = (e) => {
        if (!touched) setTouched(true);
        onChange(e);
    };

    return (
        <div>
            <input
                type={type}
                placeholder={placeholder}
                value={value}
                onChange={handleChange}
                maxLength={maxLength}
                disabled={disabled}
                className="input-field"
                style={{
                    borderColor: isInvalid ? 'var(--ember)' : undefined,
                    ...style,
                }}
            />
            {isInvalid && (
                <div style={{
                    marginTop: 5,
                    fontSize: 11,
                    color: 'var(--ember)',
                    fontFamily: 'var(--font-heading)',
                    letterSpacing: '0.06em',
                }}>
                    {errorMessage}
                </div>
            )}
        </div>
    );
}

export function FrontierDivider({ text = '✦' }) {
    return <div className="frontier-divider">{text}</div>;
}

export function SectionHeader({ children }) {
    return <div className="section-heading">{children}</div>;
}