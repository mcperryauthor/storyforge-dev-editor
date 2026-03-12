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
    lines.push(`\n${ch.title.toUpperCase()} (POV: ${ch.pov || ch.povScore || 'Unknown'})`)
    lines.push('-'.repeat(30))
    const a = ch.analysis || {}
    lines.push(`Words: ${ch.wordCount?.toLocaleString() || 0}`)
    lines.push(`Purpose: ${a.purpose?.primary || '—'}`)
    lines.push(`Emotion: ${a.emotional?.label || '—'}`)
    lines.push(`Pacing Rhythm: ${a.pacing?.rhythm || '—'}`)
    
    const flags = []
    if (a.prose) flags.push(...a.prose)
    if (a.outOfPlace) flags.push(...a.outOfPlace)
    if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, type: 'ai-pattern' })))
    
    if (flags.length === 0) {
      lines.push('Flags: None\n')
    } else {
      lines.push(`Flags (${flags.length}):`)
      flags.forEach((f, i) => {
        const sev = f.severity || (f.confidence === 'High' ? 'high' : 'medium')
        const label = f.label || f.ruleId || f.reason || 'Flag'
        lines.push(`  [${sev.toUpperCase()}] ${label}`)
        lines.push(`    "${(f.passage || f.text || f.sentence || '').slice(0, 150)}"`)
        if (f.explanation || f.reason) lines.push(`    → ${f.explanation || f.reason}`)
      })
      lines.push('')
    }
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
  addText(`Total Words: ${stats?.totalWords?.toLocaleString()}   Chapters: ${stats?.totalChapters}   Prose Flags: ${stats?.allIssues?.length}`)
  addText(`AI Pattern Density: ${stats?.aiDensityLabel || 'Low'}`)
  y += 4
  rule()
  
  addText('TOP REPEATED PHRASES', 11, true, [191, 160, 90])
  stats?.topPhrases?.slice(0, 8).forEach(([p, c]) => addText(`• "${p}" — ${c}×`, 9))
  y += 4
  
  chapters.forEach(ch => {
    rule()
    addText(`${ch.title.toUpperCase()} (POV: ${ch.pov || ch.povScore || 'Unknown'})`, 12, true, [191, 160, 90])
    const a = ch.analysis || {}
    addText(`Words: ${ch.wordCount?.toLocaleString()}  |  Primary Purpose: ${a.purpose?.primary || 'None'}  |  Emotion: ${a.emotional?.label || 'None'}`, 9, false, [176, 168, 152])
    addText(`Pacing Rhythm: ${a.pacing?.rhythm || 'Unknown'}`, 9, false, [176, 168, 152])
    y += 2
    
    const flags = []
    if (a.prose) flags.push(...a.prose)
    if (a.outOfPlace) flags.push(...a.outOfPlace)
    if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, type: 'ai-pattern' })))
    
    if (flags.length === 0) {
      addText('✓ No major structural or prose issues detected.', 9, false, [76, 168, 122])
    } else {
      flags.forEach((f, i) => {
        const sev = f.severity || (f.confidence === 'High' ? 'high' : 'medium')
        const clr = sev === 'high' ? [194,79,79] : sev === 'medium' ? [201,135,76] : [157,111,168]
        const label = f.label || f.ruleId || f.reason || 'Flag'
        
        addText(`[${sev.toUpperCase()}] ${label}`, 9, true, clr)
        if (f.passage || f.text || f.sentence) addText(`"${(f.passage || f.text || f.sentence).slice(0, 120)}"`, 8.5, false, [176, 168, 152])
        if (f.explanation || f.reason) addText((f.explanation || f.reason).slice(0, 180), 8, false, [110, 104, 96])
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
        new Paragraph({ text: `Total Prose Flags: ${stats?.allIssues?.length}` }),
        new Paragraph({ text: `AI Pattern Density: ${stats?.aiDensityLabel || 'Low'}` }),
        new Paragraph({ text: "" }),
        
        new Paragraph({ text: "TOP REPEATED PHRASES", heading: HeadingLevel.HEADING_3 }),
        ...(stats?.topPhrases?.slice(0, 10).map(([p, c]) => new Paragraph({ text: `• "${p}" — ${c}x` })) || []),
        new Paragraph({ text: "" }),
        
        ...chapters.flatMap(ch => {
          const a = ch.analysis || {}
          const children = [
            new Paragraph({ text: `${ch.title.toUpperCase()} (POV: ${ch.pov || ch.povScore || 'Unknown'})`, heading: HeadingLevel.HEADING_2 }),
            new Paragraph({ text: `Words: ${ch.wordCount?.toLocaleString()}  |  Purpose: ${a.purpose?.primary || 'None'}  |  Emotion: ${a.emotional?.label || 'None'}` }),
            new Paragraph({ text: `Pacing Rhythm: ${a.pacing?.rhythm || 'Unknown'}` }),
            new Paragraph({ text: "" }),
          ]
          
          const flags = []
          if (a.prose) flags.push(...a.prose)
          if (a.outOfPlace) flags.push(...a.outOfPlace)
          if (a.aiPatterns) flags.push(...a.aiPatterns.map(p => ({ ...p, type: 'ai-pattern' })))
          
          if (flags.length === 0) {
            children.push(new Paragraph({ text: "✓ No major structural or prose issues detected." }))
            children.push(new Paragraph({ text: "" }))
          } else {
            flags.forEach(f => {
              const sev = f.severity || (f.confidence === 'High' ? 'high' : 'medium')
              const label = f.label || f.ruleId || f.reason || 'Flag'
              children.push(new Paragraph({
                children: [
                  new TextRun({ text: `[${sev.toUpperCase()}] ${label}`, bold: true })
                ]
              }))
              if (f.passage || f.text || f.sentence) {
                children.push(new Paragraph({
                  children: [new TextRun({ text: `"${(f.passage || f.text || f.sentence).slice(0, 200)}"`, italics: true })]
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
