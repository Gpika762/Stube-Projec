const express = require('express');
const yts = require('yt-search');
// IMPORTANTE: Cambiamos a la librería que sí funciona actualmente
const ytdl = require('@distube/ytdl-core'); 
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// --- CONFIGURACIÓN DE RUTAS ---
app.use(express.static(__dirname));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error("Error enviando index.html:", err);
            res.status(404).send("Error: index.html no encontrado en la raíz.");
        }
    });
});

// --- LÓGICA DE BÚSQUEDA ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4 official';
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
        console.error("Error en búsqueda:", err);
        res.status(500).json({ error: "Fallo en la conexión con YouTube" });
    }
});

// --- LÓGICA DE REPRODUCCIÓN (OPTIMIZADA) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).send("Falta el ID del video");

        // Opciones ultra-reforzadas para que YouTube no nos bloquee en Render
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

        // Intentamos forzar el itag 18 (360p MP4) para máxima compatibilidad con el S4
        let format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        // Si no encuentra el 18, buscamos cualquier MP4 que tenga audio y video
        if (!format || !format.url) {
            format = ytdl.filterFormats(info.formats, 'audioandvideo')
                         .find(f => f.container === 'mp4');
        }
        
        if (format && format.url) {
            res.json({ url: format.url });
        } else {
            res.status(404).json({ error: "No se encontró un formato compatible" });
        }
    } catch (err) {
        console.error("Error detallado en play:", err.message);
        res.status(500).json({ 
            error: "YouTube bloqueó la petición en el servidor",
            detalle: err.message 
        });
    }
});

// Puerto dinámico
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("===============================");
    console.log("    STUBE SERVER 2016 ONLINE   ");
    console.log(`    Puerto: ${PORT}            `);
    console.log(`    Ruta: ${__dirname}         `); 
    console.log("===============================");
});
