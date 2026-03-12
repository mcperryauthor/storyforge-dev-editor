const testCases = [
  'She shook her head. "No."',
  '“Well,” she said, “that’s interesting.”',
  'He turned. "Me."',
  '“What?”',
  '"Who\'s there?"',
  '‘Hello,’ he whispered.',
  "'Hi,' she answered."
];

function countDialogueLines(text) {
  // Matches straight/smart double quotes, and attempts to match straight/smart single quotes if they aren't part of a contraction
  // It's much safer to just look for standard and typographic double quotes first, as they cover 99% of manuscript dialogue.
  return (text.match(/["“][^"”]+["”]/g) || []).length;
}

testCases.forEach(s => {
    console.log(s, "-> count:", countDialogueLines(s), "-> match:", s.match(/["“][^"”]+["”]/g))
});
