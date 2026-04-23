const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// --- CONFIGURACIÓN DE RUTAS (MODO RAÍZ) ---
app.use(express.static(__dirname));

// Ruta principal: Entrega el index.html que está junto al server.js
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error("Error enviando index.html:", err);
            res.status(404).send("Error: index.html no encontrado en la raíz.");
        }
    });
});

// --- LÓGICA DE BÚSQUEDA (MANTENIDA) ---
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

// --- LÓGICA DE REPRODUCCIÓN (CON PARCHE ANTIBLOQUEO) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).send("Falta el ID del video");

        // Opciones de solicitud reforzadas para evitar bloqueos
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                }
            }
        });

        // itag 18 = 360p MP4. El que mejor corre en los Galaxy S2, S3 y S4.
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        if (format && format.url) {
            res.json({ url: format.url });
        } else {
            // Si no hay 360p, mandamos cualquier MP4 que funcione
            const fallback = ytdl.filterFormats(info.formats, 'audioandvideo')
                                 .find(f => f.container === 'mp4');
            res.json({ url: fallback ? fallback.url : null });
        }
    } catch (err) {
        console.error("Error detallado en play:", err.message);
        res.status(500).json({ 
            error: "No se pudo obtener el link del video",
            detalle: err.message 
        });
    }
});

// Puerto dinámico para Render (10000 es el estándar de Render, 8080 como reserva)
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log("===============================");
    console.log("    STUBE SERVER 2016 ONLINE   ");
    console.log(`    Puerto: ${PORT}            `);
    console.log(`    Ruta: ${__dirname}         `); 
    console.log("===============================");
});
