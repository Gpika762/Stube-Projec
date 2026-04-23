const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// --- CONFIGURACIÓN DE RUTAS (MODO RAÍZ) ---
// Ya no necesitamos publicFolder porque el archivo está suelto en la raíz.

// Servir archivos estáticos directamente desde la raíz
app.use(express.static(__dirname));

// Ruta principal: Entrega el index.html que está junto al server.js
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'), (err) => {
        if (err) {
            console.error("Error enviando index.html:", err);
            res.status(404).send("El servidor funciona, pero no encuentra index.html en la raíz. ¡Asegúrate de haberlo sacado de la carpeta public!");
        }
    });
});

// --- LÓGICA DE BÚSQUEDA (TU ORIGINAL MEJORADA) ---
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

// --- LÓGICA DE REPRODUCCIÓN (TU ORIGINAL CON REFUERZO) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).send("Falta el ID del video");

        // Agregamos un User-Agent básico para que YouTube no nos bloquee rápido
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36'
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
        console.error("Error en play:", err);
        res.status(500).json({ error: "No se pudo obtener el link del video" });
    }
});

// Puerto dinámico para Render (8080 como reserva)
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log("===============================");
    console.log("   STUBE SERVER 2016 ONLINE    ");
    console.log(`   Puerto: ${PORT}             `);
    console.log(`   Ruta: ${publicFolder}       `);
    console.log("===============================");
});
