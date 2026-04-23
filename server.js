const express = require('express');
const axios = require('axios'); 
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const path = require('path'); // <-- IMPORTANTE: Necesario para cargar el index.html
const app = express();

// --- CONFIGURACIÓN DE ARCHIVOS ---
app.use(cors());
app.use(express.static(__dirname)); // Sirve archivos estáticos (CSS, JS del cliente)

const API_KEY = process.env.YT_API_KEY;

// --- RUTA PARA CARGAR LA INTERFAZ PRINCIPAL ---
app.get('/', (req, res) => {
    // Esto soluciona el error "Cannot GET /"
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
        console.error("Error API Google:", err.message);
        res.status(500).json({ error: "La API de Google falló" });
    }
});

// --- API DE REPRODUCCIÓN (EXTRACCIÓN CON COOKIE) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const rawCookie = process.env.YT_COOKIE || '';
        
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    // User-Agent de Android para mejorar compatibilidad con el S4
                    'User-Agent': 'Mozilla/5.0 (Linux; Android 4.4.2; GT-I9505) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.95 Mobile Safari/537.36',
                    'Cookie': rawCookie
                }
            }
        });

        // itag 18 es 360p MP4, el estándar de oro para el Galaxy S4
        const format = ytdl.chooseFormat(info.formats, { quality: '18' }); 
        res.json({ url: format ? format.url : null });
    } catch (err) {
        console.error("Error Play:", err.message);
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
    console.log(`✅ STUBE ONLINE - MODO API KEY`);
    console.log(`Puerto: ${PORT}`);
    console.log(`=================================`);
});
