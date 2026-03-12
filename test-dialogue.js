const sentences = [
  'She shook her head. "No."',
  '“Well,” she said, “that’s interesting.”',
  'He turned. "Me."',
  '“What?”',
  '"Who\'s there?"',
  '‘Hello,’ he whispered.',
  "'Hi,' she answered."
];

// Let's test a very aggressive quote watcher
function countDialogueLines(text) {
    const rx = /["“”'‘][^"“”'’]+["“”'’]/g;
    const matches = text.match(rx);
    return matches ? matches.length : 0;
}

sentences.forEach(s => {
    console.log(s, "->", countDialogueLines(s), "->", s.match(/["“”'‘][^"“”'’]+["“”'’]/g))
});

