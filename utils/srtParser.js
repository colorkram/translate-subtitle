// utils/srtParser.js
function parseSrt(text) {
    const entries = text.trim().split('\n\n');
    return entries.map(entry => {
        const [idLine, timeLine, ...textLines] = entry.split('\n');
        const id = parseInt(idLine, 10);
        const time = timeLine.trim();
        const text = textLines.join(' ');

        return { id, time, text };
    });
}

module.exports = parseSrt;
