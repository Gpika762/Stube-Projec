const express = require('express');
const axios = require('axios'); 
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const path = require('path'); 
const app = express();

app.use(cors());
app.use(express.static(__dirname)); 

const API_KEY = process.env.YT_API_KEY;

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- BÚSQUEDA HÍBRIDA (API KEY + FALLBACK) ---
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
        console.log("⚠️ Falló Google API, usando Invidious para búsqueda...");
        try {
            const fallback = await axios.get(`https://invidious.nerdvpn.de/api/v1/search?q=${req.query.q}`);
            res.json(fallback.data.map(v => ({
                id: v.videoId, title: v.title, thumb: v.videoThumbnails[0].url, author: v.author
            })));
        } catch (e) {
            res.status(500).json({ error: "Muerte total de búsqueda" });
        }
    }
});

// --- EL REPRODUCTOR INTELIGENTE (EL ALBERT EINSTEIN) ---
app.get('/api/play', async (req, res) => {
    const videoID = req.query.id;
    const rawCookie = process.env.YT_COOKIE || '';

    // INTENTO 1: YTDL-CORE (Método original optimizado)
    try {
        console.log(`[1] Intentando ytdl-core para: ${videoID}`);
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Cookie': rawCookie
                }
            }
        });
        const format = ytdl.chooseFormat(info.formats, { quality: '18' });
        if (format) return res.json({ url: format.url, method: 'ytdl' });
    } catch (err) {
        console.error("❌ ytdl-core bloqueado por YouTube.");
    }

    // INTENTO 2: INVIDIOUS API (El bypass de servidores externos)
    try {
        console.log(`[2] Intentando Invidious Bypass para: ${videoID}`);
        // Usamos una instancia robusta de Invidious
        const invidious = await axios.get(`https://invidious.projectsegfau.lt/api/v1/videos/${videoID}`);
        const stream = invidious.data.formatStreams.find(f => f.container === 'mp4' && (f.quality === 'medium' || f.resolution === '360p'));
        if (stream) return res.json({ url: stream.url, method: 'invidious' });
    } catch (err) {
        console.error("❌ Invidious también falló.");
    }

    // INTENTO 3: PIPED API (Última esperanza)
    try {
        console.log(`[3] Intentando Piped para: ${videoID}`);
        const piped = await axios.get(`https://pipedapi.kavin.rocks/streams/${videoID}`);
        const hls = piped.data.hls; // El S4 a veces se la puede con HLS si el navegador es Chrome 48+
        const direct = piped.data.videoStreams.find(v => v.format === 'VIDEO_EXTENSION_MP4' && v.quality === '360p');
        if (direct) return res.json({ url: direct.url, method: 'piped' });
    } catch (err) {
        console.error("❌ Piped falló.");
    }

    res.status(500).json({ error: "YouTube nos ganó la guerra en este video." });
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`🚀 STUBE EINSTEIN EDITION ACTIVADA`);
});
