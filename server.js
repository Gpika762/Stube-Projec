const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// AGENTE DE USUARIO: Disfraz para que YouTube no sospeche
const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// Servir la carpeta public y forzar la lectura del index.html
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// BUSCADOR: Ajustado con localización
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
        console.error("Error en búsqueda:", err);
        res.status(500).json({ error: "Error en la búsqueda" });
    }
});

// REPRODUCTOR: El Escudo Anti-Bot con Headers Reales
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        
        // Configuramos la petición para que parezca un humano navegando
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': USER_AGENT,
                    'Accept': '*/*',
                    'Accept-Language': 'es-CL,es;q=0.9',
                    'Connection': 'keep-alive'
                }
            }
        });

        // itag 18 = 360p MP4. Es el santo grial para los Galaxy S2, S3 y S4.
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        if (!format) {
            // Si el itag 18 no está, buscamos cualquier MP4 que tenga video y audio
            const fallback = ytdl.filterFormats(info.formats, 'audioandvideo')
                                 .find(f => f.container === 'mp4');
            return res.json({ url: fallback ? fallback.url : null });
        }

        res.json({ url: format.url });
    } catch (err) {
        console.error("Error en play:", err.message);
        res.status(500).json({ error: "No se pudo obtener el video", details: err.message });
    }
});

// Puerto dinámico para Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`--- Stube Server Online ---`);
    console.log(`Puerto: ${PORT}`);
});
