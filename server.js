const express = require('express');
const axios = require('axios'); // Asegúrate de tener 'axios' en tu package.json
const ytdl = require('@distube/ytdl-core');
const cors = require('cors');
const app = express();

app.use(cors());
const API_KEY = process.env.YT_API_KEY;


app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy';
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

// --- REPRODUCCIÓN (EXTRACCIÓN CON COOKIE) ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const rawCookie = process.env.YT_COOKIE || '';
        
        const info = await ytdl.getInfo(videoID, {
            requestOptions: {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                    'Cookie': rawCookie
                }
            }
        });

        const format = ytdl.chooseFormat(info.formats, { quality: '18' }); // 360p para el S4
        res.json({ url: format ? format.url : null });
    } catch (err) {
        console.error("Error Play:", err.message);
        res.status(500).json({ error: "YouTube bloqueó el enlace", detalle: err.message });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Stube Online con API Key en puerto ${PORT}`);
});
