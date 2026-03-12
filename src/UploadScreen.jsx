import styles from './UploadScreen.module.css'

const PRESETS = [
  { id: 'brokenbloom', label: 'The Broken Bloom' },
  { id: 'romantasy', label: 'Dark Fantasy / Romantasy' },
  { id: 'academy', label: 'Academy Fantasy' },
  { id: 'fiction', label: 'Literary Fiction' },
]

export default function UploadScreen({ onFileSelected, preset, onPresetChange, uploadState }) {
  const { loading, progress, step } = uploadState

  const handleDrop = (e) => {
    e.preventDefault()
    e.currentTarget.classList.remove(styles.dragOver)
    const file = e.dataTransfer.files[0]
    if (file) onFileSelected(file)
  }
  const handleDragOver = (e) => {
    e.preventDefault()
    e.currentTarget.classList.add(styles.dragOver)
  }
  const handleDragLeave = (e) => {
    e.currentTarget.classList.remove(styles.dragOver)
  }
  const handleClick = () => {
    if (!loading) document.getElementById('sf-file-input').click()
  }

  return (
    <div className={styles.screen}>
      <div className={styles.orb1} />
      <div className={styles.orb2} />

      <header className={styles.header}>
        <ForgeIcon />
        <span className={styles.logoText}>StoryForge</span>
        <span className={styles.logoSub}>Developmental Editor</span>
      </header>

      <main className={styles.main}>
        <div className={styles.hero}>
          <h1>
            Your Story,<br />
            <em>Editorially Sharp</em>
          </h1>
          <p>
            A private developmental workspace for <strong>The Broken Bloom</strong> and your other
            dark fantasy manuscripts. Upload your manuscript to receive deep structural,
            character, romance, and pacing analysis — without touching your voice.
          </p>
        </div>

        {!loading ? (
          <>
            <div
              className={styles.uploadZone}
              role="button"
              tabIndex={0}
              aria-label="Upload manuscript"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={handleClick}
              onKeyDown={e => (e.key === 'Enter' || e.key === ' ') && handleClick()}
            >
              <UploadIcon />
              <p className={styles.uploadLabel}>Drop your manuscript here</p>
              <p className={styles.uploadSub}>or click to browse</p>
              <span className={styles.formats}>.docx · .pdf · .txt · up to 150k words</span>
              <input
                type="file" id="sf-file-input" className="visually-hidden"
                accept=".docx,.pdf,.txt"
                onChange={e => e.target.files[0] && onFileSelected(e.target.files[0])}
              />
            </div>

            <div className={styles.presetRow}>
              <span className={styles.presetLabel}>Project preset:</span>
              {PRESETS.map(p => (
                <button
                  key={p.id}
                  className={`${styles.presetBtn} ${preset === p.id ? styles.active : ''}`}
                  onClick={() => onPresetChange(p.id)}
                >{p.label}</button>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.progress}>
            <p className={styles.progressLabel}>Analyzing manuscript…</p>
            <div className={styles.bar}><div className={styles.fill} style={{ width: `${progress}%` }} /></div>
            <p className={styles.progressStep}>{step}</p>
          </div>
        )}

        <div className={styles.features}>
          {FEATURES.map(f => (
            <div key={f.title} className={styles.featureCard}>
              <span className={styles.featureIcon}>{f.icon}</span>
              <div>
                <strong>{f.title}</strong>
                <p>{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </main>

      <footer className={styles.footer}>
        All processing happens in your browser. Your manuscript never leaves your device.
      </footer>
    </div>
  )
}

const FEATURES = [
  { icon: '📖', title: 'Chapter by Chapter', desc: 'Purpose, emotional movement, and editorial flags for every chapter.' },
  { icon: '💕', title: 'Romance Tracking', desc: 'Monitor tension with Killian, Lysander & Ronin across the whole arc.' },
  { icon: '🔍', title: 'Conspiracy Map', desc: 'Track Faehelm Academy clues, suspicion escalation, and reveals.' },
  { icon: '🎭', title: 'POV Voice Guard', desc: 'Detect when Elowyn, Killian, Lysander, or Ronin drift into each other\'s style.' },
  { icon: '📊', title: 'Pacing Visualization', desc: 'See dialogue, action, and introspection density per chapter.' },
  { icon: '✍️', title: 'Revision Workspace', desc: 'Mark chapters, write editorial notes, track revision goals.' },
]

function ForgeIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M5 23L14 5l9 18H5z" fill="none" stroke="url(#fgg)" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8 18h12" stroke="url(#fgg)" strokeWidth="1.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="fgg" x1="5" y1="5" x2="23" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFA05A"/><stop offset="1" stopColor="#D4B878"/>
        </linearGradient>
      </defs>
    </svg>
  )
}

function UploadIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M22 6v28M22 6l-8 8M22 6l8 8" stroke="#BFA05A" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M7 34v4a2 2 0 002 2h26a2 2 0 002-2v-4" stroke="#BFA05A" strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  )
}
