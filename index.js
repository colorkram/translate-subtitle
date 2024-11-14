const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const fs = require('fs');
const parseSrt = require('./utils/srtParser');

const app = express();
const upload = multer({ dest: 'uploads/' }); // อัปโหลดไฟล์ไปที่โฟลเดอร์ `uploads`

app.use(bodyParser.json());

// อัปโหลดและแปลงไฟล์ SRT
// app.post('/upload/:id', upload.single('file'), (req, res) => {
//     const filePath = req.file.path;
//     const id = parseInt(req.params.id, 10);
//     // อ่านไฟล์ SRT
//     fs.readFile(filePath, 'utf8', (err, data) => {
//         if (err) {
//             return res.status(500).json({ error: 'Failed to read file' });
//         }

//         const subtitles = parseSrt(data);
//         // ลบไฟล์ชั่วคราว
//         fs.unlinkSync(filePath);

//         const subtitle = subtitles.find(sub => sub.id === id);

//         if (!subtitle) {
//             return res.status(404).json({ error: 'Subtitle not found' });
//         }

//         res.json(subtitle);
//     });
// });

app.post('/upload/:id', upload.single('file'), (req, res) => {
    const filePath = req.file.path;
    const startId = parseInt(req.params.id, 10);

    // อ่านไฟล์ SRT
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read file' });
        }

        const subtitles = parseSrt(data);
        // ลบไฟล์ชั่วคราว
        fs.unlinkSync(filePath);

        // หา subtitles ตั้งแต่ startId ไปจนถึง startId + 50
        const startIndex = subtitles.findIndex(sub => sub.id === startId);
        if (startIndex === -1) {
            return res.status(404).json({ error: 'Starting ID not found' });
        }

        const endIndex = startIndex + 50;
        const subtitleRange = subtitles.slice(startIndex, endIndex);

        res.json(subtitleRange);
    });
});

app.get('/all', (req, res) => {
    const htmlContent = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Upload SRT File</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                button { padding: 10px; margin-top: 10px; }
            </style>
        </head>
        <body>
            <h1>Upload SRT File</h1>
            <form id="uploadForm" enctype="multipart/form-data" method="POST" action="/all">
                <input type="file" name="file" accept=".srt" required />
                <button type="submit">Upload</button>
            </form>
        </body>
        </html>
    `;
    res.send(htmlContent);
});

// API POST ที่รับไฟล์ SRT และแสดงข้อมูลพร้อมปุ่มคัดลอก
app.post('/all', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // อ่านไฟล์ SRT
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read file' });
        }

        const subtitles = parseSrt(data);
        fs.unlinkSync(filePath);

        const map50data = [];
        for (let i = 0; i < subtitles.length; i += 50) {
            const chunk = subtitles.slice(i, i + 50);
            const start = i + 1;
            const end = i + chunk.length;
            const key = `${start}-${end}`;
            const obj = { [key]: chunk };
            map50data.push(obj);
        }

        // สร้าง HTML ที่แสดงผลลัพธ์และปุ่มคัดลอกข้อมูลแต่ละชุด
        let htmlContent = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Subtitle Data</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .data-group { margin-bottom: 15px; }
                    button { padding: 5px 10px; cursor: pointer; }
                </style>
            </head>
            <body>
                <h1>Subtitle Data</h1>
                <p>คำสั่งสำหรับ chatGpt</p>
                <button onclick="copyTextGpt()">Download คำสั่ง</button>
                <br><br>
                <p>Click each "Download" button to copy data to clipboard:</p>
        `;

        // สร้างกลุ่มข้อมูลและปุ่มคัดลอกสำหรับแต่ละรายการใน map50data โดยใช้ data-attribute
        map50data.forEach((item, index) => {
            const itemArray = Object.values(item)[0]; // ดึง array ภายใน
            const itemText = JSON.stringify(itemArray, null, 2); // แปลง array เป็น JSON
            htmlContent += `
                <div class="data-group">
                    <p>Data Group ${index + 1} (${Object.keys(item)[0]})</p>
                    <button data-text='${itemText.replace(/'/g, "&apos;")}' onclick="copyToClipboard(this)">Download</button>
                </div>
            `;
        });

        // เพิ่มฟังก์ชัน JavaScript สำหรับคัดลอกไปยัง clipboard
        htmlContent += `
                <script>
                    function copyToClipboard(button) {
                        const text = button.getAttribute('data-text');
                        navigator.clipboard.writeText(text)
                            .then(() => console.log("Copied to clipboard!"))
                            .catch(err => alert("Failed to copy: " + err));
                    }
                    
                    function copyTextGpt() {
                        const text = 'หนังสั้นถ่ายเอง แปลซับไทยให้หน่อย\\n- ห้ามเปลี่ยนลำดับและเวลา\\n- แปลครบทุกบรรทัด\\n- ใช้ประโยคเดิมหากแปลไม่ได้\\n- เปลี่ยนคำรุนแรงให้เบาลงได้\\n- ขอข้อความแบบไฟล์ srt\\n- ไม่ต้องเพิ่มคำบรรยายอะไรมานะครับ อยาก copy ง่ายๆ';
                        navigator.clipboard.writeText(text)
                            .then(() => console.log("Copied to clipboard!"))
                            .catch(err => alert("Failed to copy: " + err));
                    }
                </script>
            </body>
            </html>
        `;

        // ส่ง HTML กลับไปที่ client
        res.send(htmlContent);
    });
});




app.post('/length', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // อ่านไฟล์ SRT
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read file' });
        }

        const subtitles = parseSrt(data);
        // ลบไฟล์ชั่วคราว
        fs.unlinkSync(filePath);

        // ส่งค่าความยาวของ subtitles
        res.json({ length: subtitles.length });
    });
});

app.post('/all', upload.single('file'), (req, res) => {
    const filePath = req.file.path;

    // อ่านไฟล์ SRT
    fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to read file' });
        }

        const subtitles = parseSrt(data);
        // ลบไฟล์ชั่วคราว
        fs.unlinkSync(filePath);

        // แบ่งข้อมูลเป็นกลุ่มละ 50 รายการ
        const map50data = [];
        for (let i = 0; i < subtitles.length; i += 50) {
            const chunk = subtitles.slice(i, i + 50);
            const start = i + 1;
            const end = i + chunk.length;
            const key = `${start}-${end}`;
            map50data.push(chunk);
        }

        // ส่งผลลัพธ์เป็น JSON
        res.json(map50data);
    });
});


// ค้นหา subtitle โดย id
app.get('/subtitle/:id', (req, res) => {
    const id = parseInt(req.params.id, 10);

    // โหลดไฟล์ SRT ที่แปลงแล้ว
    fs.readFile('uploads/subtitles.json', 'utf8', (err, data) => {
        if (err) {
            return res.status(500).json({ error: 'Failed to load subtitles' });
        }

        const subtitles = JSON.parse(data);
        const subtitle = subtitles.find(sub => sub.id === id);

        if (!subtitle) {
            return res.status(404).json({ error: 'Subtitle not found' });
        }

        res.json(subtitle);
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
