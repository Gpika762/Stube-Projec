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

// --- FUNCIÓN MAESTRA DE EXTRACCIÓN (CON BYPASS) ---
// --- FUNCIÓN MAESTRA DE EXTRACCIÓN ACTUALIZADA ---
async function obtenerLinkYouTube(id) {
    const rawCookie = process.env.YT_COOKIE || '';
    
    // Convertimos el texto de la cookie al formato que pide la librería nueva
    const cookieJSON = rawCookie.split(';').map(v => {
        const parts = v.split('=');
        return {
            name: parts[0] ? parts[0].trim() : '',
            value: parts[1] ? parts[1].trim() : '',
            domain: '.youtube.com',
            path: '/'
        };
    }).filter(cookie => cookie.name && cookie.value);

    const info = await ytdl.getInfo(id, {
        requestOptions: {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://www.youtube.com/',
                'Origin': 'https://www.youtube.com'
            },
            // Pasamos las cookies de forma estructurada
            jar: ytdl.createCookieAgent(cookieJSON)
        }
    });

    const format = ytdl.chooseFormat(info.formats, { quality: '18' }) || 
                   ytdl.filterFormats(info.formats, 'audioandvideo').find(f => f.container === 'mp4');
    
    return format ? format.url : null;
}
// --- 🕵️ MODO DETECTIVE: DIAGNÓSTICO DE ARRANQUE ---
async function realizarPruebaDeVuelo() {
    const videoTest = 'jNQXAC9IVRw'; 
    console.log("🔍 INICIANDO AUTO-DIAGNÓSTICO...");
    
    if (!process.env.YT_COOKIE) {
        console.log("⚠️ AVISO: No hay YT_COOKIE configurada. Es muy probable que falle con error 429.");
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
            console.log("CAUSA: YouTube detectó exceso de peticiones desde esta IP.");
            console.log("SOLUCIÓN: Actualiza la variable YT_COOKIE en el panel de Render.");
        } else if (err.message.includes('403')) {
            console.log("CAUSA: Acceso prohibido (IP bloqueada por YouTube).");
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
