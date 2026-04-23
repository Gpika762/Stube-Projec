const express = require('express');
const axios = require('axios'); 
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const path = require('path'); 
const app = express();

// --- CONFIGURACIÓN DE ARCHIVOS ---
app.use(cors());
app.use(express.static(__dirname)); 

const API_KEY = process.env.YT_API_KEY;

// --- RUTA PARA CARGAR LA INTERFAZ PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- API DE BÚSQUEDA (CON GOOGLE API KEY) ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4';
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=15&q=${encodeURIComponent(query)}&type=video&key=${API_KEY}`;
        
        const response = await axios.get(url);
        const videos = response.data.items.map(item => ({
            id: item.id.videoId,
            title: item.snippet.title,
            thumb: item.snippet.thumbnails.medium.url,
            author: item.snippet.channelTitle
        }));
        
        res.json(videos);
    } catch (err) {
        console.error("❌ Error API Google:", err.message);
        res.status(500).json({ error: "La API de Google falló" });
    }
});

// --- API DE REPRODUCCIÓN (CON BYPASS DE IP Y COOKIE) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const rawCookie = process.env.YT_COOKIE || '';
        
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    // Engañamos a YouTube simulando un navegador moderno pero con identidad de Android
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
                    'Cookie': rawCookie,
                    'Accept': '*/*',
                    'Accept-Language': 'es-419,es;q=0.9',
                    'Origin': 'https://www.youtube.com',
                    'Referer': 'https://www.youtube.com/',
                    'x-youtube-client-name': '1',
                    'x-youtube-client-version': '2.20240522.00.00'
                }
            }
        });

        // itag 18: 360p MP4 (Ideal para el hardware del S4)
        const format = ytdl.chooseFormat(info.formats, { quality: '18' }); 
        
        if (format && format.url) {
            res.json({ url: format.url });
        } else {
            res.status(404).json({ error: "No se encontró un formato compatible" });
        }

    } catch (err) {
        console.error("❌ Error Play:", err.message);
        res.status(500).json({ 
            error: "YouTube bloqueó el enlace", 
            detalle: err.message 
        });
    }
});

// --- ARRANQUE ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`=================================`);
    console.log(`✅ STUBE ONLINE - BYPASS MODE`);
    console.log(`Puerto: ${PORT}`);
    console.log(`=================================`);
});
