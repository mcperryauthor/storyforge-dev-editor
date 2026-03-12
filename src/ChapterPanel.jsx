import { useState } from 'react'
import styles from './ChapterPanel.module.css'
import { POV_CHARACTERS, LOVE_INTERESTS } from './devAnalyzer'

const POV_COLORS = {
  Elowyn: '#9D6FA8', Killian: '#c24f4f', Lysander: '#4f7ec2', Ronin: '#4cA87a'
}

const SECTION_LABELS = {
  purpose: '📌 Chapter Purpose',
  emotional: '💭 Emotional Movement',
  romance: '💕 Romance Tension',
  conspiracy: '🔍 Conspiracy Thread',
  povVoice: '🎭 POV Voice',
  prose: '✏️ Prose Patterns',
  outOfPlace: '⚠️ Out-of-Place Prose',
  pacing: '📊 Pacing',
}

export default function ChapterPanel({ chapter, onUpdateNotes, onUpdateStatus }) {
  const [activeSection, setActiveSection] = useState('purpose')
  const [noteDraft, setNoteDraft] = useState(chapter.notes || '')
  const a = chapter.analysis || {}
  const pov = chapter.pov || chapter.povScore

  const sections = Object.keys(SECTION_LABELS)

  return (
    <div className={styles.panel}>
      {/* Chapter header */}
      <div className={styles.chapterHeader}>
        <div className={styles.chapterMeta}>
          {pov && <span className={styles.povChip} style={{ '--c': POV_COLORS[pov] }}>{pov}</span>}
          <h2 className={styles.chapterTitle}>{chapter.title}</h2>
        </div>
        <div className={styles.metaRow}>
          <span>{(chapter.wordCount || 0).toLocaleString()} words</span>
          <span>{chapter.sentences?.length || 0} sentences</span>
          <span>{chapter.scenes?.length || 0} scenes</span>
          <StatusSelect value={chapter.revisionStatus} onChange={s => onUpdateStatus(chapter.index, s)} />
        </div>
      </div>

      {/* Section tabs */}
      <div className={styles.sectionTabs}>
        {sections.map(s => (
          <button
            key={s}
            className={`${styles.sectionTab} ${activeSection === s ? styles.active : ''}`}
            onClick={() => setActiveSection(s)}
          >
            {SECTION_LABELS[s].split(' ').slice(1).join(' ')}
          </button>
        ))}
      </div>

      {/* Section content */}
      <div className={styles.sectionContent}>
        {activeSection === 'purpose' && <PurposeSection data={a.purpose} />}
        {activeSection === 'emotional' && <EmotionalSection data={a.emotional} />}
        {activeSection === 'romance' && <RomanceSection data={a.romance} />}
        {activeSection === 'conspiracy' && <ConspiracySection data={a.conspiracy} />}
        {activeSection === 'povVoice' && <POVVoiceSection data={a.povVoice} pov={pov} />}
        {activeSection === 'prose' && <ProseSection issues={a.prose} />}
        {activeSection === 'outOfPlace' && <OutOfPlaceSection items={a.outOfPlace} />}
        {activeSection === 'pacing' && <PacingSection data={a.pacing} />}
      </div>

      {/* Notes */}
      <div className={styles.notesSection}>
        <div className={styles.notesLabel}>Editorial Notes</div>
        <textarea
          className={styles.notesArea}
          value={noteDraft}
          placeholder={'Write editorial notes for this chapter\u2026'}
          onChange={e => setNoteDraft(e.target.value)}
          onBlur={() => onUpdateNotes(chapter.index, noteDraft)}
        />
      </div>
    </div>
  )
}

// ── Sub-sections ──────────────────────────────────────────────────────────────

function PurposeSection({ data }) {
  if (!data) return <Empty />
  return (
    <div className={styles.subSection}>
      <div className={styles.primaryBadge}>Primary: <strong>{data.primary}</strong></div>
      {data.secondary && <div className={styles.secondaryBadge}>Secondary: {data.secondary}</div>}
      <div className={styles.scoreGrid}>
        {Object.entries(data.scores || {}).map(([k, v]) => (
          <div key={k} className={styles.scoreItem}>
            <span className={styles.scoreLabel}>{k}</span>
            <div className={styles.scoreBar}>
              <div className={styles.scoreFill} style={{ width: `${v}%` }} />
            </div>
            <span className={styles.scoreVal}>{v}%</span>
          </div>
        ))}
      </div>
      <Flags flags={data.flags} />
    </div>
  )
}

function EmotionalSection({ data }) {
  if (!data) return <Empty />
  return (
    <div className={styles.subSection}>
      <div className={styles.emotionRow}>
        <BigStat value={data.label} label="Overall" />
        <BigStat value={data.escalation} label="Escalation Markers" />
        <BigStat value={data.shift} label="Shift Markers" />
        <BigStat value={data.introspection} label="Introspection" />
      </div>
      <div className={styles.emotionScore}>
        <div className={styles.emotionBar}>
          <div className={styles.emotionFill} style={{ width: `${Math.min(100, data.score * 10)}%` }} />
        </div>
        <span className={styles.emotionScoreLabel}>{data.score}/10 emotional movement</span>
      </div>
      <Flags flags={data.flags} />
    </div>
  )
}

function RomanceSection({ data }) {
  if (!data) return <Empty />
  return (
    <div className={styles.subSection}>
      {LOVE_INTERESTS.map(name => {
        const r = data.byCharacter?.[name]
        if (!r) return null
        const COLORS = { Killian: '#c24f4f', Lysander: '#4f7ec2', Ronin: '#4cA87a' }
        return (
          <div key={name} className={styles.romanceCard} style={{ '--rc': COLORS[name] }}>
            <div className={styles.romanceName} style={{ color: COLORS[name] }}>{name}</div>
            <div className={styles.romanceStats}>
              <span>{r.mentions} mentions</span>
              <span>{r.kwScore} keyword hits</span>
              <strong>Tension: {r.tension.toFixed(1)}</strong>
            </div>
            <div className={styles.tensionBar}>
              <div className={styles.tensionFill} style={{ width: `${Math.min(100, r.tension * 10)}%`, background: COLORS[name] }} />
            </div>
          </div>
        )
      })}
      {data.dominant && <div className={styles.infoNote}>Dominant dynamic this chapter: <strong>{data.dominant}</strong></div>}
      <Flags flags={data.flags} />
    </div>
  )
}

function ConspiracySection({ data }) {
  if (!data) return <Empty />
  const phaseColors = { reveal: '#c24f4f', suspicion: '#c9874c', seeding: '#4f7ec2', inactive: '#6e6860' }
  return (
    <div className={styles.subSection}>
      <div className={styles.primaryBadge} style={{ '--ph': phaseColors[data.phase] || 'var(--ivory-muted)' }}>
        Phase: <strong style={{ color: phaseColors[data.phase] }}>{data.phase}</strong>
      </div>
      <div className={styles.conspStats}>
        <BigStat value={data.clueDensity} label="Clue Keywords" />
        <BigStat value={data.suspicionDensity} label="Suspicion Markers" />
        <BigStat value={data.revealDensity} label="Reveal Language" />
      </div>
      <Flags flags={data.flags} />
    </div>
  )
}

function POVVoiceSection({ data, pov }) {
  if (!data) return <div className={styles.empty}>POV voice analysis requires a detected POV character.</div>
  return (
    <div className={styles.subSection}>
      <div className={styles.primaryBadge}>Voice Strength: <strong>{data.voiceStrength}</strong></div>
      <div className={styles.voiceStats}>
        <BigStat value={data.voiceScore} label="Voice Keyword Score" />
        <BigStat value={`${data.avgLen?.toFixed(1)} w`} label="Avg Sentence Length" />
        <BigStat value={`${data.meanLen?.toFixed(1)} w`} label="Typical for POV" />
        <BigStat value={`${data.drift?.toFixed(1)}`} label="Drift" />
      </div>
      {data.contaminations?.length > 0 && (
        <div className={styles.contamList}>
          <strong className={styles.contamTitle}>Possible voice contamination:</strong>
          {data.contaminations.map((c, i) => (
            <div key={i} className={styles.contamItem}>
              From {c.from}: {c.hits.join(', ')}
            </div>
          ))}
        </div>
      )}
      <Flags flags={data.flags} />
    </div>
  )
}

function ProseSection({ issues }) {
  if (!issues?.length) return <div className={styles.empty}>No prose pattern issues detected in this chapter. ✓</div>
  return (
    <div className={styles.subSection}>
      {issues.map((issue, i) => (
        <div key={i} className={`${styles.proseIssue} ${styles[issue.severity]}`}>
          <div className={styles.issueHeader}>
            <span className={`${styles.pill} ${styles[issue.severity]}`}>{issue.severity}</span>
            <span className={styles.issueType}>{issue.type}</span>
            {issue.phrase && <code className={styles.issuePhrase}>{issue.phrase}</code>}
            {issue.count && <span className={styles.issueCount}>{issue.count}×</span>}
          </div>
          <p className={styles.issueMsg}>{issue.msg}</p>
        </div>
      ))}
    </div>
  )
}

function OutOfPlaceSection({ items }) {
  if (!items?.length) return <div className={styles.empty}>No out-of-place prose detected. ✓</div>
  return (
    <div className={styles.subSection}>
      {items.map((item, i) => (
        <div key={i} className={styles.outOfPlaceItem}>
          <span className={`${styles.pill} ${styles[item.severity]}`}>{item.severity}</span>
          <blockquote className={styles.flaggedSentence}>"{item.sentence}"</blockquote>
          <p className={styles.flagReason}>{item.reason}</p>
        </div>
      ))}
    </div>
  )
}

function PacingSection({ data }) {
  if (!data) return <Empty />
  return (
    <div className={styles.subSection}>
      <div className={styles.pacingGrid}>
        <PacingBar label="Dialogue" value={data.dialogueRatio} color="#BFA05A" unit="%" />
        <PacingBar label="Action" value={data.actionPct} color="#c24f4f" unit="%" />
        <PacingBar label="Introspection" value={data.introspectPct} color="#9D6FA8" unit="%" />
        <PacingBar label="Exposition" value={data.expositionPct} color="#4f7ec2" unit="%" />
      </div>
      <Flags flags={data.flags} />
    </div>
  )
}

function PacingBar({ label, value, color, unit }) {
  return (
    <div className={styles.pacingRow}>
      <span className={styles.pacingLabel}>{label}</span>
      <div className={styles.pacingBarWrap}>
        <div className={styles.pacingFill} style={{ width: `${Math.min(100, value)}%`, background: color }} />
      </div>
      <span className={styles.pacingVal} style={{ color }}>{value}{unit}</span>
    </div>
  )
}

function Flags({ flags }) {
  if (!flags?.length) return null
  return (
    <div className={styles.flagList}>
      {flags.map((f, i) => (
        <div key={i} className={`${styles.flag} ${styles['flag-' + f.type]}`}>
          {f.type === 'warning' ? '⚠️' : f.type === 'info' ? 'ℹ️' : '📌'} {f.msg}
        </div>
      ))}
    </div>
  )
}

function BigStat({ value, label }) {
  return (
    <div className={styles.bigStat}>
      <div className={styles.bigStatVal}>{value}</div>
      <div className={styles.bigStatLabel}>{label}</div>
    </div>
  )
}

function Empty() {
  return <div className={styles.empty}>Analysis data not available for this section.</div>
}

function StatusSelect({ value, onChange }) {
  return (
    <select className={styles.statusSelect} value={value || 'unreviewed'} onChange={e => onChange(e.target.value)}>
      <option value="unreviewed">Unreviewed</option>
      <option value="in-progress">In Progress</option>
      <option value="needs-revision">Needs Revision</option>
      <option value="revised">Revised ✓</option>
    </select>
  )
}
