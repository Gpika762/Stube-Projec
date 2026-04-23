const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// --- ESTA PARTE ES LA QUE ARREGLA EL "CANNOT GET /" ---
// 1. Le decimos que use la carpeta "public" para archivos como CSS o imágenes
app.use(express.static(path.join(__dirname, 'public')));

// 2. Le decimos que cuando alguien entre a la raíz (/), le entregue el index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});
// -------------------------------------------------------

// Tu ruta de búsqueda (déjala como está si ya te funcionaba)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4';
        const r = await yts({ query: query, hl: 'es', gl: 'CL' }); 
        const videos = r.videos.slice(0, 15).map(v => ({
            id: v.videoId,
            title: v.title,
            thumb: v.thumbnail,
            author: v.author.name,
            duration: v.timestamp,
            views: v.views,
            ago: v.ago
        }));
        res.json(videos);
    } catch (err) {
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// Tu ruta de play (déjala como está)
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const info = await ytdl.getInfo(videoID);
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        res.json({ url: format.url });
    } catch (err) {
        res.status(500).json({ error: "No se pudo obtener el video" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("Servidor Stube Online");
});
