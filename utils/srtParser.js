// utils/srtParser.js
function parseSrt(text) {
    const entries = text.trim().split(/\n{2,}/); // แยกแต่ละ entry ด้วยบรรทัดว่าง
    return entries.map(entry => {
        const lines = entry.split('\n').map(line => line.trim());
        const id = parseInt(lines[0], 10);

        // ตรวจสอบบรรทัดเวลาที่อยู่ในรูปแบบ '00:00:00,000 --> 00:00:05,000'
        const timeLine = lines[1];
        const timeRegex = /^\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}$/;
        if (!timeRegex.test(timeLine)) {
            throw new Error(`Invalid time format at ID ${id}`);
        }

        const time = timeLine;
        const text = lines.slice(2).join('\n'); // รวมบรรทัดของข้อความ

        return { id, time, text };
    });
}

module.exports = parseSrt;
