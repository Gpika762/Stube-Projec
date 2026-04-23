const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// ESTO ES LO QUE HACE QUE CARGUE TU DISEÑO AL ENTRAR
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para buscar videos (TU CODIGO ORIGINAL)
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy';
        const r = await yts(query);
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

// Ruta para sacar el link del video (TU CODIGO ORIGINAL)
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const info = await ytdl.getInfo(videoID);
        // itag 18 = 360p MP4. El mejor para los Galaxy S.
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
