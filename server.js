const express = require('express');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core'); 
const cors = require('cors');
const path = require('path');
const app = express();

// 1. Habilitar CORS para que el notebook y el S4 no tengan bloqueos de seguridad
app.use(cors());

// 2. Servir archivos estáticos desde la raíz (donde está tu index.html)
app.use(express.static(__dirname));

// --- RUTA PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error("Error: No se encontró index.html en la raíz.");
            res.status(404).send("Error: No se encontró el archivo principal.");
        }
    });
});

// --- API DE BÚSQUEDA ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4 official';
        const r = await yts(query);
        
        // Limitamos a 15 resultados para que el navegador del S4 no sufra
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
        res.status(500).json({ error: "Fallo en la conexión con YouTube" });
    }
});

// --- API DE REPRODUCCIÓN (REFORZADA PARA RENDER) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).send("Falta el ID del video");

        // Headers para simular un navegador real y saltar bloqueos de IP
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Origin': 'https://www.youtube.com',
                    'Referer': 'https://www.youtube.com/'
                }
            }
        });

        // itag 18 = 360p MP4. Es el formato "universal" que el S4 reproduce sin lag.
        let format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        // Si no hay itag 18, buscamos cualquier MP4 que tenga video y audio
        if (!format || !format.url) {
            format = ytdl.filterFormats(info.formats, 'audioandvideo')
                         .find(f => f.container === 'mp4');
        }
        
        if (format && format.url) {
            res.json({ url: format.url });
        } else {
            res.status(404).json({ error: "No se encontró un formato MP4 compatible" });
        }
    } catch (err) {
        console.error("Error en play:", err.message);
        res.status(500).json({ 
            error: "YouTube bloqueó la petición",
            detalle: err.message 
        });
    }
});

// 3. Puerto dinámico para Render (Prioriza el 10000 que es el estándar)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("===============================");
    console.log("    STUBE SERVER 2016 ONLINE   ");
    console.log(`    Puerto: ${PORT}            `);
    console.log(`    Modo: Compatibilidad S4    `);
    console.log("===============================");
});
