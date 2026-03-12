import jsPDF from 'jspdf'
import * as docx from 'docx'

export function exportToText(chapters, stats, manuscriptTitle = 'StoryForge-Report') {
  const lines = []
  lines.push('STORYFORGE — MANUSCRIPT ANALYSIS REPORT')
  lines.push('='.repeat(50))
  lines.push(`Title: ${manuscriptTitle}`)
  lines.push(`Total Words: ${stats?.totalWords?.toLocaleString() || 0}`)
  lines.push(`Total Chapters: ${stats?.totalChapters || 0}`)
  lines.push(`Total Flags: ${stats?.allIssues?.length || 0}`)
  lines.push('')
  
  lines.push('GLOBAL PATTERNS')
  lines.push('-'.repeat(30))
  lines.push(`AI Pattern Density: ${stats?.aiDensityLabel || 'Low'}`)
  lines.push('Most Repeated Phrases:')
  stats?.topPhrases?.slice(0, 10).forEach(([phrase, count]) => {
    lines.push(`  "${phrase}" — ${count}×`)
  })
  lines.push('')
  
  lines.push('CHAPTER BREAKDOWN')
  lines.push('='.repeat(50))
  
  chapters.forEach(ch => {
    lines.push(`\n${ch.title.toUpperCase()}`)
    lines.push('-'.repeat(30))
    const a = ch.analysis || {}
    lines.push(`Words: ${ch.wordCount?.toLocaleString() || 0}`)
    
    if (a.povVoice) {
      lines.push(`POV Voice: ${a.povVoice.pov} (Strength: ${a.povVoice.voiceStrength})`)
    } else {
      lines.push(`POV: ${ch.pov || ch.povScore || 'Unknown'}`)
    }
    
    // Purpose
    lines.push(`Primary Purpose: ${a.purpose?.primary || '—'}`)
    if (a.purpose?.scores) {
      const ps = a.purpose.scores
      lines.push(`  Plot: ${ps.plot} | Romance: ${ps.romance} | Worldbuilding: ${ps.worldbuilding} | Conspiracy: ${ps.conspiracy} | Char: ${ps.character}`)
    }
    
    // Emotional Movement
    lines.push(`Emotional Movement: ${a.emotional?.label || '—'} (Score: ${a.emotional?.score || 0})`)
    
    // Romance Tension
    if (a.romance) {
      lines.push(`Romance Tension: Phase [${a.romance.currentPhase || 'None'}] | Intensity: ${a.romance.intensity || 0}`)
    }
    
    // Conspiracy Thread
    if (a.conspiracy) {
      const active = a.conspiracy.vectors ? Object.entries(a.conspiracy.vectors).filter(v => v[1] > 0).map(v => v[0]) : []
      if (active.length > 0 || a.conspiracy.phase) {
        lines.push(`Conspiracy Thread: Phase [${a.conspiracy.phase || 'inactive'}] | Threads: ${active.length ? active.join(', ') : 'None'}`)
      }
    }
    
    // Pacing
    if (a.pacing) {
      lines.push(`Pacing Rhythm: ${a.pacing.rhythm || '—'}`)
      lines.push(`  Action: ${a.pacing.actionPct}% | Dialogue: ${a.pacing.dialogueRatio}% | Introsp: ${a.pacing.introspectPct}% | Expos: ${a.pacing.expositionPct}%`)
      lines.push(`  Mechanics: Conflict [${a.pacing.conflictDensity || 'Low'}] | Power Shifts: ${a.pacing.powerShifts || 0} | Stakes: ${a.pacing.stakesEvents || 0} | Energy: ${a.pacing.energyScore || 'Low'}`)
      lines.push(`  Structure: Hook [${a.pacing.sceneEntryStatus || 'Neutral'}] | Ending [${a.pacing.sceneEndingStatus || 'Neutral'}] | Tension: ${a.pacing.tensionCurve || 'Flat'}`)
    }
    
    // Flags: Prose Patterns, Out of Place Prose, AI Patterns
    const flags = []
    if (a.prose) flags.push(...a.prose.map(p => ({ ...p, _category: 'Prose Pattern' })))
    if (a.outOfPlace) flags.push(...a.outOfPlace.map(p => ({ ...p, _category: 'Out of Place Prose' })))
    if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, _category: 'AI Pattern' })))
    if (a.pacing && a.pacing.flags) flags.push(...a.pacing.flags.map(p => ({ ...p, _category: 'Pacing Warning' })))
    
    if (flags.length === 0) {
      lines.push('\nFlags: None')
    } else {
      lines.push(`\nFlags (${flags.length}):`)
      flags.forEach((f) => {
        const sev = f.severity || f.type || (f.confidence === 'High' ? 'high' : 'medium')
        const label = f.label || f.ruleId || f.reason || f.msg || 'Flag'
        lines.push(`  [${f._category.toUpperCase()}] [${sev.toUpperCase()}] ${label}`)
        const text = f.passage || f.text || f.sentence || f.phrase
        if (text) lines.push(`    "${text.slice(0, 150)}"`)
        if (f.explanation) lines.push(`    → ${f.explanation}`)
      })
    }
    lines.push('')
  })
  
  downloadBlob(lines.join('\n'), `${manuscriptTitle.replace(/\s+/g,'-').toLowerCase()}-report.txt`, 'text/plain')
}

export function exportToPDF(chapters, stats, manuscriptTitle = 'StoryForge-Report') {
  const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' })
  const margin = 20
  const pageWidth = 210
  const usable = pageWidth - margin * 2
  let y = margin
  
  const addText = (text, size = 10, bold = false, color = [232, 224, 208]) => {
    doc.setFontSize(size)
    doc.setFont('helvetica', bold ? 'bold' : 'normal')
    doc.setTextColor(...color)
    const lines = doc.splitTextToSize(text, usable)
    if (y + lines.length * (size * 0.45) > 280) {
      doc.addPage()
      doc.setFillColor(13, 12, 15)
      doc.rect(0, 0, 210, 297, 'F')
      y = margin
    }
    doc.text(lines, margin, y)
    y += lines.length * (size * 0.45) + 2
  }

  const rule = () => {
    doc.setDrawColor(100, 80, 50)
    doc.line(margin, y, pageWidth - margin, y)
    y += 4
  }

  // Background
  doc.setFillColor(13, 12, 15)
  doc.rect(0, 0, 210, 297, 'F')
  
  addText('STORYFORGE', 24, true, [191, 160, 90])
  addText('Manuscript Analysis Report — ' + manuscriptTitle, 13, false, [232, 224, 208])
  y += 4
  rule()
  
  addText('GLOBAL STATISTICS', 11, true, [191, 160, 90])
  addText(`Total Words: ${stats?.totalWords?.toLocaleString()}   Chapters: ${stats?.totalChapters}   Total Flags: ${stats?.allIssues?.length}`)
  addText(`AI Pattern Density: ${stats?.aiDensityLabel || 'Low'}`)
  y += 4
  rule()
  
  addText('TOP REPEATED PHRASES', 11, true, [191, 160, 90])
  stats?.topPhrases?.slice(0, 8).forEach(([p, c]) => addText(`• "${p}" — ${c}×`, 9))
  y += 4
  
  chapters.forEach(ch => {
    rule()
    addText(`${ch.title.toUpperCase()}`, 12, true, [191, 160, 90])
    const a = ch.analysis || {}
    addText(`Words: ${ch.wordCount?.toLocaleString()}`, 9, false, [176, 168, 152])
    
    // Deep Metrics
    if (a.povVoice) addText(`POV Voice: ${a.povVoice.pov} (Strength: ${a.povVoice.voiceStrength})`, 9, false, [176, 168, 152])
    const ps = a.purpose?.scores
    if (ps) addText(`Primary Purpose: ${a.purpose?.primary || 'None'} (Plot: ${ps.plot} | Rom: ${ps.romance} | WB: ${ps.worldbuilding} | Con: ${ps.conspiracy})`, 9, false, [176, 168, 152])
    addText(`Emotional Movement: ${a.emotional?.label || 'None'}`, 9, false, [176, 168, 152])
    if (a.romance?.currentPhase) addText(`Romance Tension Phase: ${a.romance.currentPhase} (Intensity: ${a.romance.intensity})`, 9, false, [176, 168, 152])
    if (a.conspiracy) {
      const active = a.conspiracy.vectors ? Object.entries(a.conspiracy.vectors).filter(v => v[1] > 0).map(v => v[0]) : []
      if (active.length > 0 || a.conspiracy.phase) {
         addText(`Conspiracy Thread: Phase [${a.conspiracy.phase || 'inactive'}] | Threads: ${active.length ? active.join(', ') : 'None'}`, 9, false, [176, 168, 152])
      }
    }
    if (a.pacing) {
      addText(`Pacing Rhythm: ${a.pacing.rhythm} (Act: ${a.pacing.actionPct}% | Dial: ${a.pacing.dialogueRatio}% | Int: ${a.pacing.introspectPct}% | Exp: ${a.pacing.expositionPct}%)`, 9, false, [176, 168, 152])
      addText(`Pacing Mechanics: Conflict [${a.pacing.conflictDensity || 'Low'}] | Power Shifts: ${a.pacing.powerShifts || 0} | Stakes: ${a.pacing.stakesEvents || 0} | Energy: ${a.pacing.energyScore || 'Low'}`, 9, false, [176, 168, 152])
      addText(`Pacing Structure: Hook [${a.pacing.sceneEntryStatus || 'Neutral'}] | Ending [${a.pacing.sceneEndingStatus || 'Neutral'}] | Tension: ${a.pacing.tensionCurve || 'Flat'}`, 9, false, [176, 168, 152])
    }
    y += 2
    
    const flags = []
    if (a.prose) flags.push(...a.prose.map(p => ({ ...p, _category: 'Prose Pattern' })))
    if (a.outOfPlace) flags.push(...a.outOfPlace.map(p => ({ ...p, _category: 'Out of Place Prose' })))
    if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, _category: 'AI Pattern' })))
    if (a.pacing && a.pacing.flags) flags.push(...a.pacing.flags.map(p => ({ ...p, _category: 'Pacing Warning' })))
    
    if (flags.length === 0) {
      addText('✓ No major structural or prose issues detected.', 9, false, [76, 168, 122])
    } else {
      flags.forEach((f) => {
        const sev = f.severity || f.type || (f.confidence === 'High' ? 'high' : 'medium')
        const clr = sev === 'high' ? [194,79,79] : sev === 'medium' ? [201,135,76] : [157,111,168]
        const label = f.label || f.ruleId || f.reason || f.msg || 'Flag'
        
        addText(`[${f._category}] ${label}`, 9, true, clr)
        const text = f.passage || f.text || f.sentence || f.phrase
        if (text) addText(`"${text.slice(0, 120)}"`, 8.5, false, [176, 168, 152])
        if (f.explanation) addText(f.explanation.slice(0, 180), 8, false, [110, 104, 96])
        y += 2
      })
    }
  })
  
  doc.save(`${manuscriptTitle.replace(/\s+/g,'-').toLowerCase()}-report.pdf`)
}

export async function exportToDOCX(chapters, stats, manuscriptTitle = 'StoryForge-Report') {
  const { Document, Packer, Paragraph, TextRun, HeadingLevel } = docx
  
  const doc = new Document({
    creator: "StoryForge Dev Editor",
    title: `Analysis Report: ${manuscriptTitle}`,
    styles: {
      paragraphStyles: [
        { id: "Normal", name: "Normal", run: { font: "Garamond", size: 24 } },
        { id: "Heading1", name: "Heading 1", basedOn: "Normal", run: { font: "Garamond", size: 48, bold: true, color: "111111" } },
        { id: "Heading2", name: "Heading 2", basedOn: "Normal", run: { font: "Garamond", size: 36, bold: true, color: "333333" } },
        { id: "Heading3", name: "Heading 3", basedOn: "Normal", run: { font: "Garamond", size: 28, bold: true, color: "444444" } }
      ]
    },
    sections: [{
      properties: {},
      children: [
        new Paragraph({ text: "STORYFORGE ANALYSIS REPORT", heading: HeadingLevel.HEADING_1 }),
        new Paragraph({ text: `Title: ${manuscriptTitle}`, heading: HeadingLevel.HEADING_2 }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "GLOBAL STATISTICS", heading: HeadingLevel.HEADING_3 }),
        new Paragraph({ text: `Total Words: ${stats?.totalWords?.toLocaleString()}` }),
        new Paragraph({ text: `Total Chapters: ${stats?.totalChapters}` }),
        new Paragraph({ text: `Total Flags: ${stats?.allIssues?.length}` }),
        new Paragraph({ text: `AI Pattern Density: ${stats?.aiDensityLabel || 'Low'}` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "TOP REPEATED PHRASES", heading: HeadingLevel.HEADING_3 }),
        ...(stats?.topPhrases?.slice(0, 10).map(([p, c]) => new Paragraph({ text: `• "${p}" — ${c}x` })) || []),
        new Paragraph({ text: "" }),
        
        ...chapters.flatMap(ch => {
          const a = ch.analysis || {}
          const children = [
            new Paragraph({ text: `${ch.title.toUpperCase()}`, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `Words: ${ch.wordCount?.toLocaleString()}` })
          ]
          
          if (a.povVoice) children.push(new Paragraph({ text: `POV Voice: ${a.povVoice.pov} (Strength: ${a.povVoice.voiceStrength})` }))
          
          const ps = a.purpose?.scores
          if (ps) {
              children.push(new Paragraph({ text: `Primary Purpose: ${a.purpose?.primary || 'None'} (Plot: ${ps.plot} | Romance: ${ps.romance} | Worldbuilding: ${ps.worldbuilding} | Conspiracy: ${ps.conspiracy})` }))
          }
          children.push(new Paragraph({ text: `Emotional Movement: ${a.emotional?.label || 'None'}` }))
          
          if (a.romance?.currentPhase) children.push(new Paragraph({ text: `Romance Tension: Phase [${a.romance.currentPhase}] | Intensity: ${a.romance.intensity}` }))
          
          if (a.conspiracy) {
            const active = a.conspiracy.vectors ? Object.entries(a.conspiracy.vectors).filter(v => v[1] > 0).map(v => v[0]) : []
            if (active.length > 0 || a.conspiracy.phase) {
               children.push(new Paragraph({ text: `Conspiracy Thread: Phase [${a.conspiracy.phase || 'inactive'}] | Threads: ${active.length ? active.join(', ') : 'None'}` }))
            }
          }
          
          if (a.pacing) {
             children.push(new Paragraph({ text: `Pacing Rhythm: ${a.pacing.rhythm} (Action: ${a.pacing.actionPct}% | Dialogue: ${a.pacing.dialogueRatio}% | Introsp: ${a.pacing.introspectPct}% | Expos: ${a.pacing.expositionPct}%)` }))
             children.push(new Paragraph({ text: `Pacing Mechanics: Conflict [${a.pacing.conflictDensity || 'Low'}] | Power Shifts: ${a.pacing.powerShifts || 0} | Stakes: ${a.pacing.stakesEvents || 0} | Energy: ${a.pacing.energyScore || 'Low'}` }))
             children.push(new Paragraph({ text: `Pacing Structure: Hook [${a.pacing.sceneEntryStatus || 'Neutral'}] | Ending [${a.pacing.sceneEndingStatus || 'Neutral'}] | Tension: ${a.pacing.tensionCurve || 'Flat'}` }))
          }
          
          children.push(new Paragraph({ text: "" }))
          
          const flags = []
          if (a.prose) flags.push(...a.prose.map(p => ({ ...p, _category: 'Prose Pattern' })))
          if (a.outOfPlace) flags.push(...a.outOfPlace.map(p => ({ ...p, _category: 'Out of Place Prose' })))
          if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, _category: 'AI Pattern' })))
          if (a.pacing && a.pacing.flags) flags.push(...a.pacing.flags.map(p => ({ ...p, _category: 'Pacing Warning' })))
          
          if (flags.length === 0) {
            children.push(new Paragraph({ text: "✓ No major structural or prose issues detected." }))
            children.push(new Paragraph({ text: "" }))
          } else {
            children.push(new Paragraph({ text: `Flags (${flags.length}):`, heading: HeadingLevel.HEADING_3 }))
            flags.forEach(f => {
              const sev = f.severity || f.type || (f.confidence === 'High' ? 'high' : 'medium')
              const label = f.label || f.ruleId || f.reason || f.msg || 'Flag'
              children.push(new Paragraph({
                children: [
                  new TextRun({ text: `[${f._category}] [${sev.toUpperCase()}] ${label}`, bold: true })
                ]
              }))
              
              const text = f.passage || f.text || f.sentence || f.phrase
              if (text) {
                children.push(new Paragraph({
                  children: [new TextRun({ text: `"${text.slice(0, 200)}"`, italics: true })]
                }))
              }
              if (f.explanation || f.reason) {
                children.push(new Paragraph({ text: `→ ${f.explanation || f.reason}` }))
              }
              children.push(new Paragraph({ text: "" }))
            })
          }
          return children
        })
      ]
    }]
  })
  
  const blob = await Packer.toBlob(doc)
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${manuscriptTitle.replace(/\s+/g,'-').toLowerCase()}-report.docx`
  a.click()
  URL.revokeObjectURL(url)
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}
