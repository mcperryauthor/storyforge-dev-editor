import { useState, useCallback, useEffect } from 'react'
import UploadScreen from './UploadScreen'
import ManuscriptDashboard from './ManuscriptDashboard'
import ChapterPanel from './ChapterPanel'
import { extractTextFromFile } from './fileExtractor'
import { parseManuscript, analyzeManuscript, buildManuscriptStats } from './devAnalyzer'
import styles from './App.module.css'

const AUTOSAVE_KEY = 'storyforge-project'

export default function App() {
  const [screen, setScreen] = useState('upload')
  const [uploadState, setUploadState] = useState({ loading: false, progress: 0, step: '' })
  const [preset, setPreset] = useState('brokenbloom')

  const [manuscriptTitle, setManuscriptTitle] = useState('The Broken Bloom')
  const [chapters, setChapters] = useState([])
  const [stats, setStats]   = useState(null)
  const [activeView, setActiveView] = useState('dashboard')
  const [activeChapterIndex, setActiveChapterIndex] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Load saved project from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(AUTOSAVE_KEY)
      if (saved) {
        const { title, chapters: savedChapters } = JSON.parse(saved)
        if (savedChapters?.length) {
          setManuscriptTitle(title || 'The Broken Bloom')
          setChapters(savedChapters)
          setStats(buildManuscriptStats(savedChapters))
          setScreen('analysis')
        }
      }
    } catch (_) {}
  }, [])

  // Autosave
  useEffect(() => {
    if (chapters.length) {
      localStorage.setItem(AUTOSAVE_KEY, JSON.stringify({ title: manuscriptTitle, chapters }))
    }
  }, [chapters, manuscriptTitle])

  const handleFileSelected = async (file) => {
    setUploadState({ loading: true, progress: 5, step: 'Reading file\u2026' })
    try {
      const text = await extractTextFromFile(file, (step, progress) => {
        setUploadState({ loading: true, progress, step })
      })

      setUploadState({ loading: true, progress: 65, step: 'Parsing chapters\u2026' })
      await new Promise(r => setTimeout(r, 60))

      const parsed = parseManuscript(text)
      const fileTitle = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ')
      setManuscriptTitle(fileTitle)

      setUploadState({ loading: true, progress: 80, step: 'Running developmental analysis\u2026' })
      await new Promise(r => setTimeout(r, 60))

      const analyzed = analyzeManuscript(parsed)
      setChapters(analyzed)
      setStats(buildManuscriptStats(analyzed))

      setUploadState({ loading: true, progress: 100, step: 'Complete!' })
      await new Promise(r => setTimeout(r, 300))
      setScreen('analysis')
      setActiveView('dashboard')
      setUploadState({ loading: false, progress: 0, step: '' })
    } catch (err) {
      console.error(err)
      setUploadState({ loading: false, progress: 0, step: '' })
      alert(`Error: ${err.message}`)
    }
  }

  const handleUpdateNotes = useCallback((chapterIndex, notes) => {
    setChapters(prev => prev.map(c => c.index === chapterIndex ? { ...c, notes } : c))
  }, [])

  const handleUpdateStatus = useCallback((chapterIndex, status) => {
    setChapters(prev => prev.map(c => c.index === chapterIndex ? { ...c, revisionStatus: status } : c))
  }, [])

  const handleChapterSelect = (idx) => {
    setActiveChapterIndex(idx)
    setActiveView('chapter')
  }

  const clearProject = () => {
    localStorage.removeItem(AUTOSAVE_KEY)
    setChapters([])
    setStats(null)
    setScreen('upload')
  }

  if (screen === 'upload') {
    return (
      <UploadScreen
        onFileSelected={handleFileSelected}
        preset={preset}
        onPresetChange={setPreset}
        uploadState={uploadState}
      />
    )
  }

  const activeChapter = chapters.find(c => c.index === activeChapterIndex)
  const revisedCount = chapters.filter(c => c.revisionStatus === 'revised').length

  return (
    <div className={styles.app}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.menuBtn} onClick={() => setSidebarOpen(v => !v)} aria-label="Toggle sidebar">
          ☰
        </button>
        <ForgeIcon />
        <span className={styles.logoText}>StoryForge</span>
        <div className={styles.titleBar}>
          <span className={styles.projectTitle}>{manuscriptTitle}</span>
          <span className={styles.projectMeta}>
            {stats?.totalWords.toLocaleString()} words · {stats?.totalChapters} chapters · {revisedCount}/{stats?.totalChapters} revised
          </span>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.autosave}>✓ Autosaved</span>
          <button className={styles.ghostBtn} onClick={() => { setActiveView('dashboard'); setActiveChapterIndex(null) }}>
            Dashboard
          </button>
          <button className={styles.ghostBtn} onClick={clearProject}>↑ New Project</button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* Sidebar */}
        <aside className={`${styles.sidebar} ${sidebarOpen ? '' : styles.sidebarClosed}`}>
          <div className={styles.sideSection}>
            <div className={styles.sideHead}>Overview</div>
            <button
              className={`${styles.sideItem} ${activeView === 'dashboard' ? styles.active : ''}`}
              onClick={() => { setActiveView('dashboard'); setActiveChapterIndex(null) }}
            >
              <span>◈</span> Manuscript Dashboard
            </button>
          </div>
          <div className={styles.sideSection}>
            <div className={styles.sideHead}>Chapters</div>
            {chapters.map(ch => {
              const pov = ch.pov || ch.povScore
              const POV_COLORS = { Elowyn: '#9D6FA8', Killian: '#c24f4f', Lysander: '#4f7ec2', Ronin: '#4cA87a' }
              const flags = (ch.analysis?.prose?.length || 0) + (ch.analysis?.outOfPlace?.length || 0)
              const STATUS_ICONS = { 'revised': '✓', 'in-progress': '◌', 'needs-revision': '!', 'unreviewed': '' }
              return (
                <button
                  key={ch.index}
                  className={`${styles.chapterItem} ${activeChapterIndex === ch.index ? styles.active : ''}`}
                  onClick={() => handleChapterSelect(ch.index)}
                >
                  {pov && <span className={styles.chPovDot} style={{ background: POV_COLORS[pov] }} />}
                  <span className={styles.chName}>{ch.title}</span>
                  <span className={styles.chStatus}>{STATUS_ICONS[ch.revisionStatus]}</span>
                  {flags > 0 && <span className={styles.chBadge}>{flags}</span>}
                </button>
              )
            })}
          </div>
        </aside>

        {/* Main content */}
        <main className={styles.main}>
          {activeView === 'dashboard' && (
            <div className={styles.scrollWrap}>
              <div className={styles.viewHeader}>
                <h2>Manuscript Dashboard</h2>
              </div>
              <ManuscriptDashboard
                chapters={chapters}
                stats={stats}
                onChapterSelect={handleChapterSelect}
              />
            </div>
          )}

          {activeView === 'chapter' && activeChapter && (
            <ChapterPanel
              chapter={activeChapter}
              onUpdateNotes={handleUpdateNotes}
              onUpdateStatus={handleUpdateStatus}
            />
          )}

          {activeView === 'chapter' && !activeChapter && (
            <div className={styles.emptyState}>Select a chapter from the sidebar to view its analysis.</div>
          )}
        </main>
      </div>
    </div>
  )
}

function ForgeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 28 28" fill="none">
      <path d="M5 23L14 5l9 18H5z" fill="none" stroke="url(#fghh)" strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M8 18h12" stroke="url(#fghh)" strokeWidth="1.5" strokeLinecap="round"/>
      <defs>
        <linearGradient id="fghh" x1="5" y1="5" x2="23" y2="23" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BFA05A"/><stop offset="1" stopColor="#D4B878"/>
        </linearGradient>
      </defs>
    </svg>
  )
}
