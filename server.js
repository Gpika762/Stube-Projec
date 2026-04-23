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
        console.error("Error en búsqueda:", err.message);
        res.status(500).json({ error: "Error en búsqueda" });
    }
});

// --- API DE PLAY ---
app.get('/api/play', async (req, res) => {
    try {
        const videoID = req.query.id;
        if (!videoID) return res.status(400).json({ error: "Falta ID" });
        
        const url = await obtenerLinkYouTube(videoID);
        res.json({ url });
    } catch (err) {
        console.error("❌ Error en petición /api/play:", err.message);
        res.status(500).json({ 
            error: "YouTube bloqueó el link", 
            detalle: err.message,
            ayuda: "Verifica la YT_COOKIE en las variables de entorno de Render"
        });
    }
});

// --- FUNCIÓN MAESTRA DE EXTRACCIÓN (BYPASS DIRECTO) ---
async function obtenerLinkYouTube(id) {
    const rawCookie = process.env.YT_COOKIE || '';
    
    // Usamos la cookie directamente en los headers para evitar errores de funciones inexistentes
    const info = await ytdl.getInfo(id, {
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Cookie': rawCookie,
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com'
            }
        }
    });

    // itag 18: 360p MP4, ideal para el hardware del Galaxy S4
    const format = ytdl.chooseFormat(info.formats, { quality: '18' }) || 
                   ytdl.filterFormats(info.formats, 'audioandvideo').find(f => f.container === 'mp4');
    
    return format ? format.url : null;
}

// --- 🕵️ MODO DETECTIVE: DIAGNÓSTICO DE ARRANQUE ---
async function realizarPruebaDeVuelo() {
    const videoTest = 'jNQXAC9IVRw'; 
    console.log("🔍 INICIANDO AUTO-DIAGNÓSTICO...");
    
    if (!process.env.YT_COOKIE) {
        console.log("⚠️ AVISO: No hay YT_COOKIE configurada en Render.");
    }

    try {
        const link = await obtenerLinkYouTube(videoTest);
        if (link) {
            console.log("✅ ¡ÉXITO! El servidor está entregando links correctamente.");
        } else {
            console.log("⚠️ ATENCIÓN: No se generó un link compatible (MP4/360p).");
        }
    } catch (err) {
        console.log("❌ ERROR CRÍTICO DETECTADO EN EL DEPLOY:");
        console.log("------------------------------------------------------------------");
        console.log("MENSAJE:", err.message);
        
        if (err.message.includes('429')) {
            console.log("CAUSA: YouTube detectó exceso de peticiones (Rate Limit).");
            console.log("SOLUCIÓN: Actualiza la variable YT_COOKIE en Render con tu sesión de PC.");
        } else if (err.message.includes('confirm your age') || err.message.includes('bot')) {
            console.log("CAUSA: YouTube requiere inicio de sesión (Cookie vencida o mal pegada).");
        }
        console.log("------------------------------------------------------------------");
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
    
    await realizarPruebaDeVuelo();
});
