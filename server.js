const express = require('express');
const yts = require('yt-search');
const ytdl = require('ytdl-core');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());

// Definimos la ruta de la carpeta public de forma absoluta
const publicPath = path.join(__dirname, 'public');

// Servir archivos estáticos
app.use(express.static(publicPath));

// AGENTE DE USUARIO: Disfraz de Chrome moderno en Windows 10
const AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36';

// RUTA PRINCIPAL: Forza la entrega del index.html
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'), (err) => {
        if (err) {
            console.error("Error al enviar index.html:", err);
            res.status(404).send("Error: No se encontró el archivo index.html en la carpeta public. Revisa que el nombre esté en minúsculas.");
        }
    });
});

// BUSCADOR: Con filtros para que no parezca bot
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4 official';
        const r = await yts({ 
            query: query, 
            hl: 'es', 
            gl: 'CL' 
        }); 
        
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
        console.error("Error en búsqueda:", err.message);
        res.status(500).json({ error: "Error en la búsqueda de videos" });
    }
});

// REPRODUCTOR: El "Escudo" contra el baneo de YouTube
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).json({ error: "Falta el ID del video" });

        // Engañamos a YouTube con headers de navegador real
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': AGENT,
                    'Accept': '*/*',
                    'Accept-Language': 'es-CL,es;q=0.9,en;q=0.8',
                    'Connection': 'keep-alive',
                }
            }
        });

        // itag 18 = 360p MP4 (Códec H.264). Perfecto para el hardware del S2, S3 y S4.
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        
        if (!format) {
            // Si no hay itag 18, buscamos el mp4 más cercano
            const fallback = ytdl.filterFormats(info.formats, 'audioandvideo').find(f => f.container === 'mp4');
            return res.json({ url: fallback ? fallback.url : null });
        }

        res.json({ url: format.url });
    } catch (err) {
        console.error("Error en reproducción:", err.message);
        res.status(500).json({ 
            error: "YouTube detectó actividad inusual o el video tiene restricciones.",
            details: err.message 
        });
    }
});

// Configuración del puerto para Render
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`--- Stube Server Iniciado ---`);
    console.log(`Puerto: ${PORT}`);
    console.log(`Ruta Public: ${publicPath}`);
});
