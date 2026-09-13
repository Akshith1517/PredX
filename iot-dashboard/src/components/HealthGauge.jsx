import { healthColour, healthLabel } from '../data/mockData';

/* SVG arc gauge — luxury half-circle style */
export default function HealthGauge({ score = 87, size = 220 }) {
  const R = 80;
  const cx = size / 2;
  const cy = size / 2 + 10;
  const startAngle = -210; // degrees
  const sweepTotal = 240;
  const sweepActive = (score / 100) * sweepTotal;

  const toRad = d => (d * Math.PI) / 180;
  const polar = (angle, r = R) => ({
    x: cx + r * Math.cos(toRad(angle)),
    y: cy + r * Math.sin(toRad(angle)),
  });

  const arcPath = (start, sweep, r) => {
    if (sweep <= 0) return '';
    const s = polar(start, r);
    const e = polar(start + sweep, r);
    const large = sweep > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`;
  };

  const colour = healthColour(score);
  const label  = healthLabel(score);

  // Tick marks
  const ticks = Array.from({ length: 9 }, (_, i) => {
    const angle = startAngle + (i / 8) * sweepTotal;
    const inner = polar(angle, R - 14);
    const outer = polar(angle, R - 6);
    return { inner, outer, major: i % 4 === 0 };
  });

  return (
    <svg
      width={size}
      height={size * 0.75}
      viewBox={`0 0 ${size} ${size * 0.75}`}
      style={{ display: 'block', margin: '0 auto', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="#ef4444" />
          <stop offset="33%"  stopColor="#f97316" />
          <stop offset="66%"  stopColor="#f0b429" />
          <stop offset="100%" stopColor="#22d3a5" />
        </linearGradient>
        <filter id="gaugeGlow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>

      {/* Track */}
      <path
        d={arcPath(startAngle, sweepTotal, R)}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={10}
        strokeLinecap="round"
      />

      {/* Gradient full arc (clip to active) */}
      <path
        d={arcPath(startAngle, sweepTotal, R)}
        fill="none"
        stroke="url(#gaugeGrad)"
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={`${(sweepActive / sweepTotal) * (2 * Math.PI * R)} ${2 * Math.PI * R}`}
        opacity={0.25}
      />

      {/* Active coloured arc */}
      <path
        d={arcPath(startAngle, sweepActive, R)}
        fill="none"
        stroke={colour}
        strokeWidth={10}
        strokeLinecap="round"
        filter="url(#gaugeGlow)"
        style={{ transition: 'stroke-dasharray 0.6s cubic-bezier(0.4,0,0.2,1)' }}
      />

      {/* Tick marks */}
      {ticks.map((t, i) => (
        <line
          key={i}
          x1={t.inner.x} y1={t.inner.y}
          x2={t.outer.x} y2={t.outer.y}
          stroke={t.major ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)'}
          strokeWidth={t.major ? 1.5 : 1}
        />
      ))}

      {/* Needle */}
      {(() => {
        const angle = startAngle + sweepActive;
        const tip = polar(angle, R - 2);
        const base1 = polar(angle + 90, 6);
        const base2 = polar(angle - 90, 6);
        return (
          <polygon
            points={`${tip.x},${tip.y} ${base1.x},${base1.y} ${cx},${cy} ${base2.x},${base2.y}`}
            fill={colour}
            opacity={0.9}
            filter="url(#gaugeGlow)"
            style={{ transition: 'points 0.6s cubic-bezier(0.4,0,0.2,1)' }}
          />
        );
      })()}

      {/* Centre hub */}
      <circle cx={cx} cy={cy} r={8} fill="var(--bg-elevated)" stroke={colour} strokeWidth={2} />
      <circle cx={cx} cy={cy} r={3} fill={colour} />

      {/* Score text */}
      <text
        x={cx} y={cy - 28}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="32"
        fill="#fff"
        letterSpacing="-1"
      >
        {score.toFixed(1)}
      </text>
      <text
        x={cx} y={cy - 10}
        textAnchor="middle"
        fontFamily="var(--font-body)"
        fontSize="11"
        fill="rgba(255,255,255,0.35)"
        letterSpacing="1"
      >
        HEALTH SCORE
      </text>
      <text
        x={cx} y={cy + 12}
        textAnchor="middle"
        fontFamily="var(--font-display)"
        fontWeight="700"
        fontSize="13"
        fill={colour}
        letterSpacing="1"
      >
        {label.toUpperCase()}
      </text>

      {/* Range labels */}
      {[
        { label: '0', angle: startAngle },
        { label: '50', angle: startAngle + sweepTotal * 0.5 },
        { label: '100', angle: startAngle + sweepTotal },
      ].map(({ label: lbl, angle }) => {
        const p = polar(angle, R + 18);
        return (
          <text
            key={lbl}
            x={p.x} y={p.y + 4}
            textAnchor="middle"
            fontFamily="var(--font-mono)"
            fontSize="9"
            fill="rgba(255,255,255,0.25)"
          >
            {lbl}
          </text>
        );
      })}
    </svg>
  );
}
