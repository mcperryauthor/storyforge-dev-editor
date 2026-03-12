/**
 * StoryForge — Developmental Analysis Engine
 * Analyzes manuscripts for story structure, character arcs,
 * romance dynamics, pacing, POV voice, and prose patterns.
 */

// ─── CONSTANTS ───────────────────────────────────────────────────────────────

export const POV_CHARACTERS = ['Elowyn', 'Killian', 'Lysander', 'Ronin']

export const LOVE_INTERESTS = ['Killian', 'Lysander', 'Ronin']

export const POV_VOICE_PROFILES = {
  Elowyn: {
    traits: ['restrained', 'noble', 'ideological', 'lyrical'],
    keywords: ['dignity', 'duty', 'honor', 'light', 'bloom', 'fracture', 'silence', 'ache'],
    sentenceLengthBias: 'varied', // long lyrical sentences + short fragments
  },
  Killian: {
    traits: ['aggressive', 'visceral', 'physical', 'survival'],
    keywords: ['blood', 'bone', 'fight', 'strike', 'burn', 'survive', 'break', 'fist', 'snarl'],
    sentenceLengthBias: 'short',
  },
  Lysander: {
    traits: ['political', 'manipulative', 'elegant', 'calculated'],
    keywords: ['game', 'move', 'court', 'power', 'mask', 'choose', 'conceal', 'truth', 'advantage'],
    sentenceLengthBias: 'long',
  },
  Ronin: {
    traits: ['quiet', 'observational', 'tactical', 'shadow'],
    keywords: ['shadow', 'dark', 'watch', 'still', 'wait', 'silent', 'edge', 'forest', 'observe'],
    sentenceLengthBias: 'short',
  },
}

export const CONSPIRACY_KEYWORDS = [
  'harvest', 'energy', 'drain', 'trial', 'rigged', 'corrupt', 'Life Well',
  'conspiracy', 'academy', 'Faehelm', 'sacrifice', 'institution', 'dean',
  'headmaster', 'board', 'hidden', 'secret', 'cover', 'trap',
]

export const ROMANCE_KEYWORDS = {
  Killian: ['tension', 'aggressive', 'claim', 'possessive', 'territorial', 'jealous', 'pull', 'burn'],
  Lysander: ['elegant', 'manipulate', 'game', 'dangerous', 'power', 'negotiate', 'tempt', 'cold'],
  Ronin: ['quiet', 'protect', 'gentle', 'watch', 'shadow', 'steady', 'patient', 'anchor'],
}

const MICRO_PHRASES = [
  'jaw tightens', 'jaw tightened', 'breath catches', 'breath caught',
  'pulse jumps', 'pulse jumped', 'wings flare', 'wings flared',
  'step closer', 'stepped closer', 'silence stretches', 'silence stretched',
  'heart stutters', 'chest tightens', 'stomach drops', 'throat constricts',
  'something in my chest', 'heat floods', 'skin prickles', 'world narrows',
]

const DIALOGUE_TAGS = ['murmured', 'snarled', 'whispered', 'hissed', 'growled',
  'breathed', 'purred', 'snapped', 'barked', 'spat', 'choked', 'gasped']

const AI_TELL_PATTERNS = [
  /\b(somehow|in that moment|i realized|it dawned on|suddenly understood)\b/gi,
  /\b(the weight of|the gravity of|deep down|a part of me)\b/gi,
  /\b(i couldn't help but|for a brief moment|in the silence)\b/gi,
]

// ─── PARSER ───────────────────────────────────────────────────────────────────

export function parseManuscript(rawText) {
  const lines = rawText.split('\n')
  const chapters = []
  let current = null
  let currentScene = null
  let chapterIndex = 0

  const chapterPattern = /^(#{1,3}\s*)?(chapter\s+\d+|prologue|epilogue|\bpart\s+\d+)/i
  const sceneBreak = /^(\*\s*\*\s*\*|---+|#{3,}|~{3,})$/
  const povPattern = /^\*{1,2}([A-Z][a-z]+)\*{1,2}$|^POV:\s*([A-Z][a-z]+)|^\[([A-Z][a-z]+)\]$/

  lines.forEach(line => {
    const trimmed = line.trim()

    if (chapterPattern.test(trimmed)) {
      chapterIndex++
      current = {
        index: chapterIndex,
        title: trimmed.replace(/^#+\s*/, '').trim() || `Chapter ${chapterIndex}`,
        pov: null,
        scenes: [],
        rawText: '',
        notes: '',
        revised: false,
        revisionStatus: 'unreviewed',
      }
      currentScene = { text: '', index: 0 }
      current.scenes.push(currentScene)
      chapters.push(current)
      return
    }

    if (!current) {
      current = {
        index: 0,
        title: 'Prologue / Pre-Chapter',
        pov: null,
        scenes: [],
        rawText: '',
        notes: '',
        revised: false,
        revisionStatus: 'unreviewed',
      }
      currentScene = { text: '', index: 0 }
      current.scenes.push(currentScene)
      chapters.push(current)
    }

    if (sceneBreak.test(trimmed)) {
      const nextIdx = current.scenes.length
      currentScene = { text: '', index: nextIdx }
      current.scenes.push(currentScene)
      return
    }

    const povMatch = trimmed.match(povPattern)
    if (povMatch) {
      const name = povMatch[1] || povMatch[2] || povMatch[3]
      if (POV_CHARACTERS.includes(name)) {
        current.pov = name
      }
      return
    }

    if (trimmed) {
      currentScene.text += ' ' + trimmed
      current.rawText += ' ' + trimmed
    }
  })

  // Finalize
  chapters.forEach(ch => {
    ch.wordCount = countWords(ch.rawText)
    ch.sentences = getSentences(ch.rawText)
    ch.dialogueLines = countDialogueLines(ch.rawText)
    ch.povScore = inferPOV(ch)
  })

  return chapters
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function countWords(text) {
  return (text.match(/\b\w+\b/g) || []).length
}

function getSentences(text) {
  return text.match(/[^.!?]+[.!?]+/g) || []
}

function countDialogueLines(text) {
  return (text.match(/[""][^""]+[""]/g) || []).length
}

function avgSentenceLen(sentences) {
  if (!sentences.length) return 0
  return sentences.reduce((s, x) => s + x.split(/\s+/).length, 0) / sentences.length
}

function inferPOV(chapter) {
  if (chapter.pov) return chapter.pov
  const text = chapter.rawText.toLowerCase()
  let best = null, bestScore = 0
  POV_CHARACTERS.forEach(name => {
    const profile = POV_VOICE_PROFILES[name]
    let score = 0
    profile.keywords.forEach(kw => {
      const count = (text.match(new RegExp(`\\b${kw}\\b`, 'g')) || []).length
      score += count
    })
    if (score > bestScore) { bestScore = score; best = name }
  })
  return best
}

function phraseCount(text, phrase) {
  const re = new RegExp(phrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
  return (text.match(re) || []).length
}

function wordCount(text, word) {
  return (text.toLowerCase().match(new RegExp(`\\b${word}\\b`, 'g')) || []).length
}

// ─── MODULE: CHAPTER PURPOSE ─────────────────────────────────────────────────

const PLOT_KW = ['battle', 'fight', 'attack', 'reveal', 'discover', 'escape', 'trap', 'trial', 'compete', 'confront']
const ROMANCE_KW = ['kiss', 'touch', 'close', 'breath', 'feel', 'pull', 'want', 'lips', 'tension', 'desire']
const WB_KW = ['court', 'academy', 'fae', 'magic', 'power', 'realm', 'history', 'lore', 'rule', 'law']
const CONSPIRACY_KW = [...CONSPIRACY_KEYWORDS]
const CHARACTER_KW = ['think', 'felt', 'believe', 'fear', 'hope', 'grief', 'memory', 'decide', 'realize']
const INTROSPECT_KW = ['wonder', 'reflect', 'remember', 'question', 'doubt', 'ponder', 'consider']

export function classifyChapterPurpose(chapter) {
  const text = chapter.rawText.toLowerCase()
  const scores = {
    plot:        PLOT_KW.reduce((s,k) => s + wordCount(text, k), 0),
    romance:     ROMANCE_KW.reduce((s,k) => s + wordCount(text, k), 0),
    worldbuilding: WB_KW.reduce((s,k) => s + wordCount(text, k), 0),
    conspiracy:  CONSPIRACY_KW.reduce((s,k) => s + wordCount(text, k.toLowerCase()), 0),
    character:   CHARACTER_KW.reduce((s,k) => s + wordCount(text, k), 0),
    introspection: INTROSPECT_KW.reduce((s,k) => s + wordCount(text, k), 0),
  }

  const total = Object.values(scores).reduce((a,b) => a+b, 1)
  const normalized = {}
  Object.entries(scores).forEach(([k,v]) => { normalized[k] = Math.round((v/total)*100) })

  const sorted = Object.entries(normalized).sort((a,b) => b[1]-a[1])
  const primary = sorted[0]
  const secondary = sorted[1]

  const flags = []
  if (primary[1] < 15) flags.push({ type: 'warning', msg: 'Chapter purpose unclear — no dominant function detected.' })
  if (normalized.introspection > 40) flags.push({ type: 'warning', msg: 'Heavy introspection ratio — chapter may stall pacing.' })
  if (normalized.romance < 5 && chapter.index > 3) flags.push({ type: 'note', msg: 'No significant romance beats — consider if romantic tension is maintained.' })

  return { scores: normalized, primary: primary[0], secondary: secondary[0], flags }
}

// ─── MODULE: EMOTIONAL MOVEMENT ───────────────────────────────────────────────

const EMOTION_ESCALATION = ['more', 'worse', 'deeper', 'further', 'breaking', 'shatter', 'rupture', 'crack']
const EMOTION_SHIFT = ['realize', 'decide', 'choose', 'accept', 'refuse', 'change', 'shift', 'turn']

export function analyzeEmotionalMovement(chapter) {
  const text = chapter.rawText.toLowerCase()
  const escalation = EMOTION_ESCALATION.reduce((s,k) => s + wordCount(text, k), 0)
  const shift = EMOTION_SHIFT.reduce((s,k) => s + wordCount(text, k), 0)
  const introspection = INTROSPECT_KW.reduce((s,k) => s + wordCount(text, k), 0)

  const flags = []
  if (escalation < 2 && shift < 2) {
    flags.push({ type: 'warning', msg: 'No clear emotional movement detected. POV character may not grow or shift in this chapter.' })
  }
  if (introspection > 15 && shift < 2) {
    flags.push({ type: 'note', msg: 'High introspection without emotional shift — consider whether internal processing leads to a decision.' })
  }

  const score = Math.min(10, escalation + shift)
  const label = score >= 7 ? 'Strong' : score >= 4 ? 'Moderate' : 'Flat'

  return { escalation, shift, introspection, score, label, flags }
}

// ─── MODULE: ROMANCE TENSION ──────────────────────────────────────────────────

export function analyzeRomanceTension(chapter) {
  const text = chapter.rawText.toLowerCase()
  const results = {}
  let totalFlags = []

  LOVE_INTERESTS.forEach(name => {
    const nameLower = name.toLowerCase()
    const mentions = wordCount(text, nameLower)
    const kw = ROMANCE_KEYWORDS[name] || []
    const kwScore = kw.reduce((s, k) => s + wordCount(text, k), 0)
    const tension = Math.round((mentions * 0.4 + kwScore * 0.6) * 10) / 10

    results[name] = { mentions, kwScore, tension }
  })

  // Check for dynamics
  const dominant = Object.entries(results).sort((a,b) => b[1].tension - a[1].tension)[0]
  const flags = []

  if (Object.values(results).every(r => r.tension < 2)) {
    flags.push({ type: 'note', msg: 'No significant romantic interaction in this chapter.' })
  }
  if (dominant && dominant[1].tension > 8) {
    flags.push({ type: 'info', msg: `Strong ${dominant[0]} tension — good momentum.` })
  }

  return { byCharacter: results, dominant: dominant?.[0], flags }
}

// ─── MODULE: CONSPIRACY TRACKING ──────────────────────────────────────────────

const CLUE_DENSITY_THRESHOLD = 3
const REVEAL_KW = ['revealed', 'discovered', 'confirmed', 'proven', 'exposed', 'confessed', 'admitted']
const SUSPICION_KW = ['suspicious', 'wrong', 'off', 'strange', 'doubt', 'question', 'wonder', 'notice']

export function analyzeConspiracyArc(chapter) {
  const text = chapter.rawText.toLowerCase()
  const clueDensity = CONSPIRACY_KEYWORDS.reduce((s,k) => s + wordCount(text, k.toLowerCase()), 0)
  const revealDensity = REVEAL_KW.reduce((s,k) => s + wordCount(text, k), 0)
  const suspicionDensity = SUSPICION_KW.reduce((s,k) => s + wordCount(text, k), 0)

  const flags = []
  if (revealDensity > 3 && chapter.index < 8) {
    flags.push({ type: 'warning', msg: 'Major reveal language appears early — consider if this exposes plot before tension has built.' })
  }
  if (clueDensity > 8) {
    flags.push({ type: 'note', msg: 'High conspiracy keyword density — ensure clues feel organic, not expository.' })
  }
  if (clueDensity === 0 && chapter.index > 3) {
    flags.push({ type: 'note', msg: 'No conspiracy thread in this chapter — consider weaving in a minor clue.' })
  }

  const phase = revealDensity > 2 ? 'reveal' : suspicionDensity > 3 ? 'suspicion' : clueDensity > 0 ? 'seeding' : 'inactive'

  return { clueDensity, revealDensity, suspicionDensity, phase, flags }
}

// ─── MODULE: POV VOICE CONSISTENCY ──────────────────────────────────────────

export function analyzePOVVoice(chapter, allChapters) {
  const pov = chapter.pov || chapter.povScore
  if (!pov || !POV_VOICE_PROFILES[pov]) return null

  const profile = POV_VOICE_PROFILES[pov]
  const text = chapter.rawText.toLowerCase()
  const avgLen = avgSentenceLen(chapter.sentences)

  // Compare to other chapters of same POV
  const samePOV = allChapters.filter(c => (c.pov || c.povScore) === pov && c.index !== chapter.index)
  const meanLen = samePOV.length
    ? samePOV.reduce((s,c) => s + avgSentenceLen(c.sentences), 0) / samePOV.length
    : avgLen

  const drift = Math.abs(avgLen - meanLen)
  const flags = []

  if (drift > meanLen * 0.35 && samePOV.length >= 2) {
    flags.push({
      type: 'warning',
      msg: `${pov}\u2019s sentence rhythm deviates from their baseline (avg ${avgLen.toFixed(1)} vs typical ${meanLen.toFixed(1)} words). Voice may be drifting.`,
    })
  }

  // Check for cross-voice keyword contamination
  const otherVoices = Object.entries(POV_VOICE_PROFILES).filter(([k]) => k !== pov)
  const contaminations = []
  otherVoices.forEach(([otherName, otherProfile]) => {
    const hits = otherProfile.keywords.filter(kw => wordCount(text, kw) >= 3)
    if (hits.length >= 3) {
      contaminations.push({ from: otherName, hits })
      flags.push({
        type: 'note',
        msg: `Voice note: "${hits.join(', ')}" — terms more associated with ${otherName}\u2019s voice appearing frequently. Check for drift.`,
      })
    }
  })

  const voiceScore = profile.keywords.reduce((s,k) => s + wordCount(text, k), 0)
  const voiceStrength = voiceScore >= 8 ? 'Strong' : voiceScore >= 4 ? 'Moderate' : 'Weak'

  return { pov, avgLen, meanLen, drift, voiceScore, voiceStrength, contaminations, flags }
}

// ─── MODULE: PROSE PATTERN SCANNER ─────────────────────────────────────────

export function scanProsePatterns(chapter, sensitivity = 3) {
  const issues = []
  const text = chapter.rawText
  const sentences = chapter.sentences

  // 1. Sentence starters
  const starterMap = {}
  sentences.forEach(s => {
    const words = s.trim().split(/\s+/).slice(0,2).join(' ').toLowerCase().replace(/[^a-z\s]/g,'')
    if (words.length < 2) return
    starterMap[words] = (starterMap[words] || 0) + 1
  })
  Object.entries(starterMap).forEach(([starter, count]) => {
    if (count >= Math.max(3, 5 - sensitivity)) {
      issues.push({
        type: 'sentence-starter', severity: count >= 8 ? 'high' : 'medium',
        phrase: starter, count,
        msg: `"${starter}" used ${count}× to open sentences.`,
      })
    }
  })

  // 2. Micro-phrases
  MICRO_PHRASES.forEach(phrase => {
    const count = phraseCount(text, phrase)
    if (count >= Math.max(2, 3 - sensitivity)) {
      issues.push({
        type: 'micro-phrase', severity: count >= 4 ? 'high' : 'medium',
        phrase, count,
        msg: `"${phrase}" appears ${count}× — emotional shorthand may be losing impact.`,
      })
    }
  })

  // 3. Dialogue tags
  DIALOGUE_TAGS.forEach(tag => {
    const count = wordCount(text.toLowerCase(), tag)
    if (count >= Math.max(3, 5 - sensitivity)) {
      issues.push({
        type: 'dialogue-tag', severity: count >= 8 ? 'high' : 'medium',
        phrase: tag, count,
        msg: `"${tag}" used ${count}× as a dialogue tag.`,
      })
    }
  })

  // 4. AI-tell patterns
  AI_TELL_PATTERNS.forEach(re => {
    const matches = text.match(re) || []
    if (matches.length >= 2) {
      issues.push({
        type: 'ai-tell', severity: 'low',
        phrase: String(re),
        count: matches.length,
        msg: `AI-tell phrase cluster detected: ${[...new Set(matches.slice(0,3))].join(', ')} (${matches.length}×)`,
      })
    }
  })

  return issues
}

// ─── MODULE: OUT-OF-PLACE PROSE ──────────────────────────────────────────────

const GENERIC_PROSE = [
  /\bshe smiled\b/gi, /\bhe nodded\b/gi, /\bshe nodded\b/gi,
  /\bit was clear that\b/gi, /\bit was obvious\b/gi,
  /\bthe atmosphere was\b/gi, /\bthe mood was\b/gi,
  /\bshe was beautiful\b/gi, /\bhe was handsome\b/gi,
]

const MODERN_SLIPS = /\b(okay|ok|yep|nope|gonna|wanna|kinda|sorta|totally|literally|like,)\b/gi

export function detectOutOfPlaceProse(chapter) {
  const results = []
  chapter.sentences.forEach((sentence, i) => {
    const lo = sentence.toLowerCase()
    GENERIC_PROSE.forEach(pattern => {
      if (pattern.test(lo)) {
        results.push({
          sentence: sentence.trim(),
          reason: 'Generic / flat prose — reads as stock description rather than voice-specific observation.',
          severity: 'low',
          sentenceIndex: i,
        })
      }
    })
    if (MODERN_SLIPS.test(sentence)) {
      results.push({
        sentence: sentence.trim(),
        reason: 'Modern colloquial language that may break the dark fantasy register.',
        severity: 'medium',
        sentenceIndex: i,
      })
    }
    MODERN_SLIPS.lastIndex = 0
  })
  return results
}

// ─── MODULE: PACING ANALYZER ──────────────────────────────────────────────────

const ACTION_KW = ['fight', 'run', 'strike', 'attack', 'fly', 'leap', 'crash', 'burst', 'race', 'chase']
const EXPOSITION_KW = ['explained', 'described', 'was known', 'in the days', 'historically', 'long ago', 'it had been']

export function analyzePacing(chapter) {
  const text = chapter.rawText.toLowerCase()
  const wc = chapter.wordCount || 1

  const dialogueRatio   = Math.round((chapter.dialogueLines / Math.max(chapter.sentences.length, 1)) * 100)
  const actionScore     = ACTION_KW.reduce((s,k) => s + wordCount(text, k), 0)
  const introspectScore = INTROSPECT_KW.reduce((s,k) => s + wordCount(text, k), 0)
  const expositionScore = EXPOSITION_KW.reduce((s,k) => s + wordCount(text, k), 0)

  const actionPct      = Math.min(100, Math.round((actionScore / wc) * 1000))
  const introspectPct  = Math.min(100, Math.round((introspectScore / wc) * 1000))
  const expositionPct  = Math.min(100, Math.round((expositionScore / wc) * 400))

  const flags = []
  if (expositionPct > 30) flags.push({ type: 'warning', msg: 'Heavy exposition — may slow pacing significantly.' })
  if (introspectPct > 35) flags.push({ type: 'note', msg: 'Long introspection block — ensure it builds to decision or action.' })
  if (dialogueRatio < 5 && actionScore < 5) flags.push({ type: 'note', msg: 'Low dialogue and action density — chapter may feel static.' })

  return { dialogueRatio, actionPct, introspectPct, expositionPct, flags }
}

// ─── MASTER ANALYSIS ──────────────────────────────────────────────────────────

export function analyzeManuscript(chapters, settings = {}) {
  return chapters.map(chapter => ({
    ...chapter,
    analysis: {
      purpose:    classifyChapterPurpose(chapter),
      emotional:  analyzeEmotionalMovement(chapter),
      romance:    analyzeRomanceTension(chapter),
      conspiracy: analyzeConspiracyArc(chapter),
      povVoice:   analyzePOVVoice(chapter, chapters),
      prose:      scanProsePatterns(chapter, settings.sensitivity ?? 3),
      outOfPlace: detectOutOfPlaceProse(chapter),
      pacing:     analyzePacing(chapter),
    },
  }))
}

// ─── MANUSCRIPT STATS ─────────────────────────────────────────────────────────

export function buildManuscriptStats(analyzedChapters) {
  const totalWords = analyzedChapters.reduce((s, c) => s + (c.wordCount || 0), 0)
  const totalScenes = analyzedChapters.reduce((s, c) => s + c.scenes.length, 0)

  const povDist = {}
  POV_CHARACTERS.forEach(p => { povDist[p] = 0 })
  analyzedChapters.forEach(c => {
    const pov = c.pov || c.povScore
    if (pov && povDist[pov] !== undefined) povDist[pov]++
  })

  const romanceTotals = {}
  LOVE_INTERESTS.forEach(n => { romanceTotals[n] = 0 })
  analyzedChapters.forEach(c => {
    const r = c.analysis?.romance?.byCharacter || {}
    LOVE_INTERESTS.forEach(n => { romanceTotals[n] += r[n]?.tension || 0 })
  })

  const conspiracyByChapter = analyzedChapters.map(c => ({
    chapter: c.title,
    index: c.index,
    density: c.analysis?.conspiracy?.clueDensity || 0,
    phase: c.analysis?.conspiracy?.phase || 'inactive',
  }))

  const allIssues = analyzedChapters.flatMap(c => (c.analysis?.prose || []).map(i => ({
    ...i, chapter: c.title, chapterIndex: c.index,
  })))

  const topPhrases = {}
  analyzedChapters.forEach(c => {
    ;(c.analysis?.prose || []).filter(i => i.type === 'micro-phrase').forEach(i => {
      topPhrases[i.phrase] = (topPhrases[i.phrase] || 0) + i.count
    })
  })

  return {
    totalWords,
    totalChapters: analyzedChapters.length,
    totalScenes,
    povDist,
    romanceTotals,
    conspiracyByChapter,
    allIssues,
    topPhrases: Object.entries(topPhrases).sort((a,b)=>b[1]-a[1]).slice(0,12),
  }
}
