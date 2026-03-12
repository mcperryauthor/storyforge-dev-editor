const fs = require('fs');

const paragraph = `When I opened the door, she looked up and said, 'Hello there.' And then I replied, ‘Why are you here?’ She said: "Because." I frowned and said: “I don’t know.” He added, "It’s not my fault." Let's try ‘single quotes’ too.`;

console.log("Raw text sample:", paragraph);

function countQuotes(text) {
  // Let's aggressively match double straight, double curly, single straight, single curly quotes wrapping text
  // Using \s or start of line to avoid catching apostrophes inside words like 'don't'
  const rx = /(?:^|\s)["“'‘][^"”'’]+["”'’](?=\s|$|[.,!?])/g;
  return (text.match(rx) || []).length;
}

console.log("Matches:", countQuotes(paragraph));
const matches = paragraph.match(/(?:^|\s)["“'‘][^"”'’]+["”'’](?=\s|$|[.,!?])/g);
console.log("Found:", matches);
