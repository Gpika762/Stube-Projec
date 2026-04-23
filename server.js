const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
// Servir archivos estáticos de la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// AGENTE DE USUARIO: El "disfraz" para engañar a YouTube
const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Forzar que cargue el index.html al entrar a la URL principal
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta para buscar videos
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4 official';
        // Buscamos usando el agente de usuario
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
        console.error("Error en búsqueda:", err);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// Ruta para sacar el link del video (CON ENGAÑO ANTI-BOT)
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        
        // Aquí está el truco: mandamos headers como si fueras un PC moderno
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': AGENT,
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
                    'Accept-Language': 'es-ES,es;q=0.8,en-US;q=0.5,en;q=0.3',
                }
            }
        });

        // itag 18 = 360p MP4. Lo mejor para S2, S3 y S4.
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        if (!format) {
            return res.status(404).json({ error: "Formato no compatible" });
        }

        res.json({ url: format.url });
    } catch (err) {
        console.error("Error en reproducción:", err);
        res.status(500).json({ error: "YouTube bloqueó la petición o el ID es inválido" });
    }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`Stube Server corriendo en el puerto ${PORT}`);
});
