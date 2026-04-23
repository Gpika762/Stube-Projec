const express = require('express');
const yts = require('yt-search');
const ytdl = require('@distube/ytdl-core'); 
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.static(__dirname));

// --- RUTA PRINCIPAL ---
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- API DE BÚSQUEDA ---
app.get('/api/search', async (req, res) => {
    try {
        const query = req.query.q || 'Samsung Galaxy S4';
        const r = await yts(query);
        res.json(r.videos.slice(0, 15).map(v => ({
            id: v.videoId, title: v.title, thumb: v.thumbnail,
            author: v.author.name, duration: v.timestamp,
            views: v.views, ago: v.ago
        })));
    } catch (err) {
        res.status(500).json({ error: "Error en búsqueda" });
    }
});

// --- API DE PLAY ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        const url = await obtenerLinkYouTube(videoID);
        res.json({ url });
    } catch (err) {
        console.error("❌ Error en petición /api/play:", err.message);
        res.status(500).json({ error: "YouTube bloqueó el link", detalle: err.message });
    }
});

// --- FUNCIÓN MAESTRA DE EXTRACCIÓN ---
async function obtenerLinkYouTube(id) {
    const info = await ytdl.getInfo(id, {
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com'
            }
        }
    });
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }) || 
                   ytdl.filterFormats(info.formats, 'audioandvideo').find(f => f.container === 'mp4');
    return format ? format.url : null;
}

// --- 🕵️ MODO DETECTIVE: PRUEBA AL ARRANCAR ---
async function realizarPruebaDeVuelo() {
    const videoTest = 'jNQXAC9IVRw'; // Video clásico de "Me at the zoo"
    console.log("🔍 INICIANDO AUTO-DIAGNÓSTICO...");
    try {
        const link = await obtenerLinkYouTube(videoTest);
        if (link) {
            console.log("✅ ¡ÉXITO! Link de prueba obtenido correctamente.");
        } else {
            console.log("⚠️ ATENCIÓN: El link salió vacío pero no hubo error de código.");
        }
    } catch (err) {
        console.log("❌ ERROR DETECTADO EN EL DEPLOY:");
        console.log("---------------------------------------");
        console.log("MENSAJE:", err.message);
        if (err.message.includes('403')) console.log("CAUSA: YouTube baneó la IP de este servidor de Render.");
        if (err.message.includes('confirm your age')) console.log("CAUSA: El video tiene restricción de edad.");
        console.log("---------------------------------------");
    }
}

// --- ARRANQUE DEL SERVIDOR ---
const PORT = process.env.PORT || 10000;
app.listen(PORT, async () => {
    console.log("===============================");
    console.log("    STUBE SERVER 2016 ONLINE   ");
    console.log(`    Puerto: ${PORT}            `);
    console.log(`    Modo: Compatibilidad S4    `);
    console.log("===============================");
    
    // Ejecutamos la prueba apenas sube el server
    await realizarPruebaDeVuelo();
});
