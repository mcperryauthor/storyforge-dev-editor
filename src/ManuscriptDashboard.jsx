import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, Cell } from 'recharts'
import styles from './ManuscriptDashboard.module.css'
import { POV_CHARACTERS, LOVE_INTERESTS } from './devAnalyzer'

const POV_COLORS = {
  Elowyn: '#9D6FA8', Killian: '#c24f4f', Lysander: '#4f7ec2', Ronin: '#4cA87a'
}
const ROMANCE_COLORS = {
  Killian: '#c24f4f', Lysander: '#4f7ec2', Ronin: '#4cA87a'
}

export default function ManuscriptDashboard({ chapters, stats, onChapterSelect }) {
  if (!stats || !chapters.length) return null

  const pacingData = chapters.map(c => ({
    name: c.title.slice(0,12) + (c.title.length > 12 ? '\u2026' : ''),
    Dialogue: c.analysis?.pacing?.dialogueRatio || 0,
    Action:   c.analysis?.pacing?.actionPct || 0,
    Introspection: c.analysis?.pacing?.introspectPct || 0,
    Exposition: c.analysis?.pacing?.expositionPct || 0,
  }))

  const romanceData = chapters.map(c => {
    const row = { name: c.title.slice(0,10) + '\u2026' }
    LOVE_INTERESTS.forEach(n => {
      row[n] = c.analysis?.romance?.byCharacter?.[n]?.tension || 0
    })
    return row
  })

  const conspiracyData = stats.conspiracyByChapter

  return (
    <div className={styles.dashboard}>
      {/* Top stat cards */}
      <div className={styles.statRow}>
        <StatCard value={stats.totalWords.toLocaleString()} label="Total Words" color="var(--gold)" />
        <StatCard value={stats.totalChapters} label="Chapters" color="var(--plum-light)" />
        <StatCard value={stats.totalScenes} label="Scenes" color="var(--lysander)" />
        <StatCard value={stats.allIssues.length} label="Prose Flags" color="var(--sev-medium)" />
      </div>

      {/* POV distribution */}
      <div className={styles.gridRow}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>POV Distribution</div>
          <div className={styles.povBars}>
            {POV_CHARACTERS.map(pov => {
              const count = stats.povDist[pov] || 0
              const pct = Math.round((count / stats.totalChapters) * 100)
              return (
                <div key={pov} className={styles.povRow}>
                  <span className={styles.povName} style={{ color: POV_COLORS[pov] }}>{pov}</span>
                  <div className={styles.povBarWrap}>
                    <div className={styles.povBarFill} style={{ width: `${pct}%`, background: POV_COLORS[pov] }} />
                  </div>
                  <span className={styles.povCount}>{count} ch</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Romance totals */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Romance Arc Totals</div>
          <div className={styles.romanceBars}>
            {LOVE_INTERESTS.map(name => {
              const total = stats.romanceTotals[name] || 0
              const max = Math.max(...LOVE_INTERESTS.map(n => stats.romanceTotals[n] || 0), 1)
              const pct = Math.round((total / max) * 100)
              return (
                <div key={name} className={styles.povRow}>
                  <span className={styles.povName} style={{ color: ROMANCE_COLORS[name] }}>{name}</span>
                  <div className={styles.povBarWrap}>
                    <div className={styles.povBarFill} style={{ width: `${pct}%`, background: ROMANCE_COLORS[name] }} />
                  </div>
                  <span className={styles.povCount}>{total.toFixed(1)}</span>
                </div>
              )
            })}
          </div>
          <p className={styles.cardNote}>Tension score across all chapters (higher = more sustained tension)</p>
        </div>

        {/* Top flagged phrases */}
        <div className={styles.card}>
          <div className={styles.cardTitle}>Most Repeated Phrases</div>
          {stats.topPhrases.slice(0,8).map(([phrase, count]) => (
            <div key={phrase} className={styles.phraseRow}>
              <span className={styles.phraseText}>"{phrase}"</span>
              <span className={styles.phraseCount}>{count}×</span>
            </div>
          ))}
        </div>
      </div>

      {/* Pacing Chart */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Chapter Pacing Breakdown</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={pacingData} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--ivory)' }} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--ivory-muted)' }} />
              <Bar dataKey="Dialogue" fill="#BFA05A" radius={[2,2,0,0]} />
              <Bar dataKey="Action" fill="#c24f4f" radius={[2,2,0,0]} />
              <Bar dataKey="Introspection" fill="#9D6FA8" radius={[2,2,0,0]} />
              <Bar dataKey="Exposition" fill="#4f7ec2" radius={[2,2,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Romance tension per chapter */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Romance Tension Per Chapter</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={romanceData} margin={{ top: 6, right: 12, left: -20, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }} />
              <YAxis tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }} />
              <Tooltip contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--ivory)' }} />
              <Legend wrapperStyle={{ fontSize: '0.75rem', color: 'var(--ivory-muted)' }} />
              {LOVE_INTERESTS.map(name => (
                <Line key={name} type="monotone" dataKey={name}
                  stroke={ROMANCE_COLORS[name]} strokeWidth={2} dot={false} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conspiracy arc */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Conspiracy Arc Density</div>
        <div className={styles.chartWrap}>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={conspiracyData} margin={{ top: 4, right: 12, left: -20, bottom: 0 }}>
              <XAxis dataKey="chapter" tick={false} />
              <YAxis tick={{ fill: 'var(--ivory-muted)', fontSize: 10 }} />
              <Tooltip content={<ConspiracyTooltip />} />
              <Bar dataKey="density" radius={[2,2,0,0]}>
                {conspiracyData.map((entry, i) => (
                  <Cell key={i} fill={
                    entry.phase === 'reveal' ? '#c24f4f' :
                    entry.phase === 'suspicion' ? '#c9874c' :
                    entry.phase === 'seeding' ? '#4f7ec2' : 'var(--bg-elevated)'
                  } />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className={styles.legendRow}>
          <LegendDot color="#4f7ec2" label="Seeding" />
          <LegendDot color="#c9874c" label="Suspicion" />
          <LegendDot color="#c24f4f" label="Reveal" />
        </div>
      </div>

      {/* Chapter table */}
      <div className={styles.card}>
        <div className={styles.cardTitle}>Chapter Overview</div>
        <div className={styles.tableWrap}>
          <div className={styles.tableHead}>
            <span>Chapter</span>
            <span>POV</span>
            <span>Words</span>
            <span>Purpose</span>
            <span>Emotion</span>
            <span>Flags</span>
          </div>
          {chapters.map(ch => {
            const a = ch.analysis || {}
            const pov = ch.pov || ch.povScore
            const flags = (a.prose?.length || 0) + (a.outOfPlace?.length || 0) +
              (a.purpose?.flags?.length || 0) + (a.emotional?.flags?.length || 0)
            return (
              <div key={ch.index} className={styles.tableRow}
                onClick={() => onChapterSelect(ch.index)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && onChapterSelect(ch.index)}
              >
                <span className={styles.chTitle}>{ch.title}</span>
                <span className={styles.chPov} style={{ color: pov ? POV_COLORS[pov] : 'var(--ivory-muted)' }}>
                  {pov || '—'}
                </span>
                <span className={styles.chNum}>{(ch.wordCount || 0).toLocaleString()}</span>
                <span className={styles.chPurpose}>{a.purpose?.primary || '—'}</span>
                <span className={styles.chEmotion}>{a.emotional?.label || '—'}</span>
                <span className={styles.chFlags} data-count={flags}>
                  {flags > 0 ? `${flags} flags` : '✓'}
                </span>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function StatCard({ value, label, color }) {
  return (
    <div className={styles.statCard} style={{ '--c': color }}>
      <div className={styles.statValue} style={{ color }}>{value}</div>
      <div className={styles.statLabel}>{label}</div>
    </div>
  )
}

function ConspiracyTooltip({ active, payload }) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', padding: '0.5rem 0.75rem', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--ivory)' }}>
      <strong>{d?.chapter}</strong><br />
      Density: {d?.density} &nbsp;·&nbsp; Phase: {d?.phase}
    </div>
  )
}

function LegendDot({ color, label }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--ivory-muted)' }}>
      <span style={{ background: color, width: 10, height: 10, borderRadius: 2, display: 'inline-block' }} />
      {label}
    </span>
  )
}
