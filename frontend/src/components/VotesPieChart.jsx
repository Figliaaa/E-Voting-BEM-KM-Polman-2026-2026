import React, { useEffect, useRef, useState } from 'react';

const PALETTES = [
    { bg: '#BA7517', border: '#FAC775', pattern: 'solid'    },
    { bg: '#A32D2D', border: '#F7C1C1', pattern: 'dashed'   },
    { bg: '#185FA5', border: '#B5D4F4', pattern: 'dotted'   },
    { bg: '#0F6E56', border: '#9FE1CB', pattern: 'dash-dot' },
    { bg: '#533AB7', border: '#CECBF6', pattern: 'solid'    },
    { bg: '#714E12', border: '#FAC775', pattern: 'dashed'   },
    { bg: '#791F1F', border: '#F09595', pattern: 'dotted'   },
    { bg: '#085041', border: '#5DCAA5', pattern: 'dash-dot' },
];

function makeHatch(ctx, color, style, size = 16) {
    const oc = document.createElement('canvas');
    oc.width = oc.height = size;
    const c = oc.getContext('2d');
    c.fillStyle = color;
    c.fillRect(0, 0, size, size);
    c.strokeStyle = 'rgba(0,0,0,0.22)';
    c.lineWidth = 1.5;
    if (style === 'dashed') {
        c.beginPath(); c.setLineDash([3, 3]);
        for (let y = 0; y <= size; y += 6) { c.moveTo(0, y); c.lineTo(size, y); }
        c.stroke();
    } else if (style === 'dotted') {
        c.fillStyle = 'rgba(0,0,0,0.22)';
        for (let x = 3; x < size; x += 8)
            for (let y = 3; y < size; y += 8) {
                c.beginPath(); c.arc(x, y, 1.5, 0, Math.PI * 2); c.fill();
            }
    } else if (style === 'dash-dot') {
        c.setLineDash([1, 4]);
        for (let x = 0; x <= size; x += 8) {
            c.beginPath(); c.moveTo(x, 0); c.lineTo(x, size); c.stroke();
        }
    }
    return ctx.createPattern(oc, 'repeat');
}

function VotesPieChart({ candidates = [], totalVotes = 0 }) {
    const canvasRef = useRef(null);
    const chartRef  = useRef(null);
    const [hoverIdx, setHoverIdx] = useState(null);

    const isDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? false;
    const textMuted = isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.4)';
    const textMain  = isDark ? 'rgba(255,255,255,0.88)' : 'rgba(0,0,0,0.84)';
    const surfaceBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const borderClr = isDark ? 'rgba(255,255,255,0.1)'  : 'rgba(0,0,0,0.08)';

    const total = totalVotes || candidates.reduce((s, c) => s + (c.jumlah_suara || 0), 0);

    const highlightSlice = (idx) => {
        if (!chartRef.current) return;
        const meta = chartRef.current.getDatasetMeta(0);
        meta.data.forEach((arc, i) => {
            arc.options.offset = (i === idx) ? 14 : 0;
        });
        chartRef.current.update('none');
        setHoverIdx(idx);
    };

    useEffect(() => {
        if (!canvasRef.current || candidates.length === 0) return;

        if (chartRef.current) { chartRef.current.destroy(); }

        const ctx = canvasRef.current.getContext('2d');

        const bgPatterns = candidates.map((_, i) => {
            const p = PALETTES[i % PALETTES.length];
            if (p.pattern === 'solid') return p.bg;
            return makeHatch(ctx, p.bg, p.pattern);
        });

        chartRef.current = new window.Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: candidates.map(c => c.nama_ketua),
                datasets: [{
                    data: candidates.map(c => c.jumlah_suara || 0),
                    backgroundColor: bgPatterns,
                    borderColor: PALETTES.map((p, i) => i < candidates.length ? p.border : 'transparent'),
                    borderWidth: 2,
                    hoverOffset: 0,
                    offset: candidates.map(() => 0),
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '62%',
                layout: { padding: 18 },
                animation: { animateRotate: true, duration: 900, easing: 'easeInOutQuart' },
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        enabled: true,
                        callbacks: {
                            label: (ctx) => {
                                const pct = total > 0 ? ((ctx.parsed / total) * 100).toFixed(1) : '0.0';
                                return `  ${ctx.parsed} suara  (${pct}%)`;
                            },
                            afterLabel: (ctx) => `  & ${candidates[ctx.dataIndex]?.nama_wakil ?? ''}`,
                        },
                        backgroundColor: isDark ? 'rgba(20,14,6,0.96)' : 'rgba(255,252,245,0.98)',
                        borderColor: isDark ? 'rgba(200,150,12,0.35)' : 'rgba(180,117,23,0.3)',
                        borderWidth: 1,
                        titleColor: isDark ? '#E8B800' : '#BA7517',
                        bodyColor: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.55)',
                        padding: 10,
                        cornerRadius: 6,
                        displayColors: true,
                        boxWidth: 10, boxHeight: 10,
                    },
                },
                onHover: (_, els) => {
                    const idx = els.length > 0 ? els[0].index : null;
                    if (idx !== hoverIdx) highlightSlice(idx);
                },
            },
            plugins: [{
                id: 'centerLabel',
                afterDraw(chart) {
                    const { ctx: c, chartArea: { left, top, right, bottom } } = chart;
                    const cx = (left + right) / 2;
                    const cy = (top + bottom) / 2;
                    c.save();
                    c.textAlign = 'center';
                    c.textBaseline = 'middle';
                    c.fillStyle = isDark ? '#E8B800' : '#BA7517';
                    c.font = '500 28px system-ui';
                    c.fillText(total, cx, cy - 10);
                    c.fillStyle = isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.35)';
                    c.font = '400 11px system-ui';
                    c.fillText('total suara', cx, cy + 12);
                    c.restore();
                },
            }],
        });

        return () => { if (chartRef.current) chartRef.current.destroy(); };
    }, [candidates, totalVotes]);

    if (candidates.length === 0 || total === 0) {
        return (
            <div style={{
                textAlign: 'center',
                padding: '40px 20px',
                fontFamily: 'var(--font-heading)',
                fontSize: 16,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'rgba(200,170,120,0.25)',
            }}>
                Belum ada data suara
            </div>
        );
    }

    return (
        <div style={{ width: '100%' }}>
            {/* Legend */}
            <div style={{
                display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16,
            }}>
                {candidates.map((c, i) => {
                    const pct = total > 0 ? ((c.jumlah_suara / total) * 100).toFixed(1) : '0.0';
                    const p = PALETTES[i % PALETTES.length];
                    const isHovered = hoverIdx === i;
                    return (
                        <span
                            key={c.id}
                            onMouseEnter={() => highlightSlice(i)}
                            onMouseLeave={() => highlightSlice(null)}
                            style={{
                                display: 'inline-flex', alignItems: 'center', gap: 6,
                                padding: '4px 10px',
                                borderRadius: 6,
                                background: isHovered ? (isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.05)') : 'transparent',
                                cursor: 'pointer', transition: 'background 0.15s',
                                fontFamily: 'var(--font-heading)',
                                fontSize: 20, letterSpacing: '0.04em',
                                color: textMuted,
                            }}
                        >
                            <span style={{
                                width: 12, height: 12, borderRadius: 2,
                                background: p.bg,
                                border: `1px solid ${p.border}`,
                                flexShrink: 0,
                            }} />
                            {c.nama_ketua}
                            <strong style={{ color: textMain, fontWeight: 500 }}>{pct}%</strong>
                        </span>
                    );
                })}
            </div>

            {/* Chart canvas */}
            <div style={{ position: 'relative', width: '100%', height: 260 }}>
                <canvas ref={canvasRef} role="img" aria-label="Donut chart distribusi suara kandidat">
                    {candidates.map(c => `${c.nama_ketua}: ${c.jumlah_suara} suara`).join(', ')}
                </canvas>
            </div>

            {/* Candidate cards */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 10, marginTop: 16,
            }}>
                {candidates.map((c, i) => {
                    const pct = total > 0 ? ((c.jumlah_suara / total) * 100).toFixed(1) : '0.0';
                    const p = PALETTES[i % PALETTES.length];
                    const isHovered = hoverIdx === i;
                    return (
                        <div
                            key={c.id}
                            onMouseEnter={() => highlightSlice(i)}
                            onMouseLeave={() => highlightSlice(null)}
                            style={{
                                background: surfaceBg,
                                border: `0.5px solid ${isHovered ? p.bg : borderClr}`,
                                borderLeft: `3px solid ${p.bg}`,
                                borderRadius: 6,
                                padding: '10px 12px',
                                cursor: 'pointer',
                                transition: 'border-color 0.15s, transform 0.15s',
                                transform: isHovered ? 'translateY(-2px)' : 'none',
                            }}
                        >
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 11, letterSpacing: '0.12em',
                                textTransform: 'uppercase',
                                color: textMuted, marginBottom: 3,
                            }}>
                                Kandidat {i + 1}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-heading)',
                                fontSize: 16, fontWeight: 600,
                                color: textMain, marginBottom: 1,
                            }}>
                                {c.nama_ketua}
                            </div>
                            <div style={{
                                fontFamily: 'var(--font-body)',
                                fontStyle: 'italic', fontSize: 11,
                                color: textMuted, marginBottom: 8,
                            }}>
                                &amp; {c.nama_wakil}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                                <span style={{
                                    fontFamily: 'var(--font-display)',
                                    fontSize: 27,
                                    color: p.bg,
                                }}>
                                    {c.jumlah_suara}
                                </span>
                                <span style={{
                                    fontFamily: 'var(--font-heading)',
                                    fontSize: 16, color: textMuted,
                                }}>
                                    suara · {pct}%
                                </span>
                            </div>
                            {/* Mini bar */}
                            <div style={{
                                height: 3, marginTop: 8,
                                background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                                borderRadius: 2, overflow: 'hidden',
                            }}>
                                <div style={{
                                    height: '100%',
                                    width: `${pct}%`,
                                    background: p.bg,
                                    borderRadius: 2,
                                    transition: 'width 0.6s ease',
                                }} />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default VotesPieChart;