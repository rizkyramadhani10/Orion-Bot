const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const Groq = require("groq-sdk");
const cron = require('node-cron');
const Tesseract = require('tesseract.js');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');
const axios = require('axios');
const youtubedl = require('youtube-dl-exec');
const os = require('os');
const platform = os.platform(); // Akan menghasilkan 'win32' di laptop, dan 'android' di Termux
require('dotenv').config();

// API KEY GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const qrcode = require('qrcode-terminal');

// Fungsi untuk membuat bot "menunggu"
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const withTimeout = async (promise, timeoutMs, timeoutMessage) => {
    let timeoutHandle;
    const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);
    });

    try {
        return await Promise.race([promise, timeoutPromise]);
    } finally {
        clearTimeout(timeoutHandle);
    }
};

const estimateBase64Bytes = (base64String) => Math.floor((base64String.length * 3) / 4);

// Delay acak antara 3-4 detik
const getRandomDelay = () => Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000;

// ==========================================
// 🔥 HELPER: NATURAL DELAY REPLY (TEKNIK DRY)
// Fungsi pembungkus untuk membalas pesan dengan status "Mengetik..." dan jeda acak
// ==========================================
const replyWithDelay = async (msg, content) => {
    try {
        const chat = await msg.getChat();
        await chat.sendStateTyping(); // Otomatis memunculkan status "mengetik..."
    } catch (error) {
        console.error("[SYSTEM] Gagal mengirim status typing:", error.message);
    } // Abaikan jika gagal

    await sleep(getRandomDelay());
    return await msg.reply(content);
};

// Her ID
const nadiaID = '62895622571988@c.us';

// Footer global bot
const footer = "\n\n> ⓘ 𝖮𝗋𝗂𝗈𝗇-𝖡𝗈𝗍";

const GREETING_PATH = path.join(__dirname, 'last_greeting.json');
const OWNER_ID = process.env.OWNER_ID || '6289602160689@c.us';
const CHROME_PATH = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FFMPEG_PATH = process.env.FFMPEG_PATH || 'D:/Scoopapp/apps/ffmpeg/current/bin/ffmpeg.exe';
const FFMPEG_DIR = path.dirname(FFMPEG_PATH);
const JADWAL_PATH = path.join(__dirname, 'jadwal.json');
const PENERIMA_PATH = path.join(__dirname, 'penerima.json');

const JADWAL_CACHE_TTL_MS = 60 * 1000;
const MAX_SUM_MEDIA_BYTES = 6 * 1024 * 1024;
const MAX_DOWNLOADED_AUDIO_BYTES = 18 * 1024 * 1024;
const OCR_TIMEOUT_MS = 60 * 1000;

let cachedJadwal = null;
let jadwalLastLoadMs = 0;
let isReinitializing = false;

const loadJadwal = async () => {
    const now = Date.now();
    if (cachedJadwal && (now - jadwalLastLoadMs) < JADWAL_CACHE_TTL_MS) {
        return cachedJadwal;
    }

    const raw = await fsp.readFile(JADWAL_PATH, 'utf8');
    cachedJadwal = JSON.parse(raw);
    jadwalLastLoadMs = now;
    return cachedJadwal;
};

const loadPenerima = async () => {
    if (!fs.existsSync(PENERIMA_PATH)) {
        return [];
    }

    const raw = await fsp.readFile(PENERIMA_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
};

const loadLastGreetings = async () => {
    if (!fs.existsSync(GREETING_PATH)) return {};
    const raw = await fsp.readFile(GREETING_PATH, 'utf8');
    return JSON.parse(raw);
};

const saveLastGreetings = async (data) => {
    await fsp.writeFile(GREETING_PATH, JSON.stringify(data, null, 2), 'utf8');
};

const savePenerima = async (listPenerima) => {
    await fsp.writeFile(PENERIMA_PATH, JSON.stringify(listPenerima, null, 2), 'utf8');
};

const client = new Client({
    authStrategy: new LocalAuth(),

    ffmpegPath: platform === 'android' ? '/data/data/com.termux/files/usr/bin/ffmpeg' : FFMPEG_PATH,
    puppeteer: {
        headless: true,
        executablePath: platform === 'android' ? '/data/data/com.termux/files/usr/bin/chromium-browser' : CHROME_PATH,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu',
            '--disable-extensions',
            '--disable-component-extensions-with-background-pages',
            '--disable-default-apps',
            '--mute-audio',
            '--no-default-browser-check',
            '--autoplay-policy=user-gesture-required',
            '--disable-background-timer-throttling',
            '--disable-backgrounding-occluded-windows',
            '--disable-notifications',
            '--disable-background-networking',
            '--disable-breakpad',
            '--disable-component-update',
            '--disable-domain-reliability',
            '--disable-sync',
            '--disable-software-rasterizer'
        ]
    }
});

const scheduleReinitialize = (reason) => {
    if (isReinitializing) return;

    isReinitializing = true;
    console.warn(`[SYSTEM] Mencoba inisialisasi ulang dalam 10 detik. Alasan: ${reason}`);

    setTimeout(async () => {
        try {
            await client.initialize();
            console.log('[SYSTEM] Re-initialize berhasil.');
        } catch (error) {
            console.error('[SYSTEM] Re-initialize gagal:', error.message || error);
        } finally {
            isReinitializing = false;
        }
    }, 10000);
};

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR di atas dengan WhatsApp kamu!');
});

client.on('ready', () => {
    console.log('Orion Ready!');
    console.log("API Key terdeteksi:", process.env.GROQ_API_KEY ? "Ya" : "Tidak");

    const nodeMajor = Number(process.versions.node.split('.')[0]);
    if (Number.isFinite(nodeMajor) && nodeMajor > 20) {
        console.warn(`[WARN] Node.js ${process.versions.node} terdeteksi. Untuk whatsapp-web.js, versi LTS 20 biasanya lebih stabil.`);
    }
});

client.on('auth_failure', (message) => {
    console.error('[SYSTEM] Auth failure:', message);
});

client.on('disconnected', (reason) => {
    console.error('[SYSTEM] Client disconnected:', reason);
    scheduleReinitialize(reason);
});

client.on('message_create', async (msg) => {
    // 1. Abaikan status
    if (msg.from === 'status@broadcast' || msg.isStatus) return;

    // 2. Abaikan chat dari diri sendiri (biar gak nyaut pas kamu ngetik manual)
    // Hapus baris ini kalau kamu lagi mau ngetes fitur bot sendiri
    // if (msg.fromMe) return;

    if (typeof msg.body === 'string' && (msg.body.includes('𝖮𝗋𝗂𝗈𝗇-𝖡𝗈𝗍') || msg.body.includes('𝖮𝗋𝗂𝗈𝗇-𝖢𝗁𝖺𝗍'))) return;

    // 3. Pastikan pesan ada isinya dan berupa teks
    if (!msg.body || !['chat', 'image', 'video', 'gif'].includes(msg.type)) return;

    // 4. (Opsional) Abaikan grup jika kamu mau bot ini privat buat Nadia & kamu saja
    if (msg.isGroupMsg) return;

    const body = (typeof msg.body === 'string' ? msg.body : '').trim();
    const bodyLower = body.toLowerCase();

    // ==========================================
    // 1. FITUR MENU UTAMA V3 (!1033)
    // ==========================================
    if (body === '!1033') {
        let namaUser = 'Human';
        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            const jam = new Date().getHours();
            let sapaan = "Selamat malam!";
            if (jam >= 5 && jam < 11) sapaan = "Selamat pagi!";
            else if (jam >= 11 && jam < 15) sapaan = "Selamat siang!";
            else if (jam >= 15 && jam < 18) sapaan = "Selamat sore!";

            const contact = await msg.getContact();
            namaUser = contact.pushname || "Kak";

            const delay = getRandomDelay();
            await sleep(delay);

            const teksMenu = `. * ✦ . * . ✦ . * . * ✦ . * . ✦ . * .

█▀█ █▀█ █ █▀█ █▄ █
█▄█ █▀▄ █ █▄█ █ ▀█

. * ✦ . * . ✦ . * . * ✦ . * . ✦ . * .

\${sapaan}, \${namaUser}! 🌟


╭─────〔 🌠 𝐒𝐘𝐒𝐓𝐄𝐌 𝐈𝐍𝐅𝐎 〕── . *
│ 💫 Creator : Rix . +
│ 📡 Status  : Online [Active] * .
╰─────────────────── . * . * .

╭─────〔 💫 𝐂𝐎𝐑𝐄 𝐅𝐄𝐀𝐓𝐔𝐑𝐄𝐒 〕── . *
│ ✨ *!stiker* . * + .
│ ✨ *!brat* <teks> ✦ . *
│ ✨ *!tanya* <soal> . + .
│ ✨ *!vn* <teks> * . ✦ *
╰─────────────────── . * . * .

╭─────〔 ☄️ 𝐌𝐄𝐃𝐈𝐀 𝐑𝐄𝐓𝐑𝐈𝐄𝐕𝐄𝐑 〕── . *
│ 🌌 *!tt* / *!ttmp3* . * .
│ 🌌 *!ig* <link> + . ✦ *
│ 🌌 *!ytmp3* <link> . * .
│ 🌌 *!fbmp3* <link> * . +
│ 🌌 *!soundcloud* . ✦ .
╰──────────────────────── . * . * .

╭─────〔 🪐 𝐒𝐓𝐔𝐃𝐄𝐍𝐓 𝐒𝐔𝐈𝐓𝐄 〕── . *
│ 🔭 *!jadwal* * . + . *
│ 🔭 *!ajukan* . ✦ . * .
│ 📚 *!sum*(Rangkum) * . +
╰───────────────────── . * . * . * . * .

╭─────〔 🛰️ 𝐔𝐓𝐈𝐋𝐈𝐓𝐘 〕── . *
│ 🛠️ *!myid* . * . ✦ .
│ 🛠️ *!deactivate* + . *
╰────────────────────── . * . * .

. * ✦ . * . ✦ . * . * ✦ . * . ✦ . * .

> 🌠 Orion is still evolving! My owner, Ki, is calibrating my systems among the stars. I might have some solar flares (glitches) occasionally, but I'm getting brighter. Thanks for navigating with me!`;

            await client.sendMessage(msg.from, teksMenu + footer);
            console.log(`Menu terkirim untuk: ${namaUser}`);
        } catch (error) {
            console.error("Gagal mengirim menu:", error);
            const fallbackTeks = `*[ 𝐎𝐑𝐈𝐎𝐍 𝐏𝐑𝐎𝐉𝐄𝐂𝐓 ]*\n\n${namaUser}, terjadi kesalahan saat memuat gambar menu.`;
            await sleep(getRandomDelay());
            await client.sendMessage(msg.from, fallbackTeks);
        }
    }

    // ==========================================
    // 2. FITUR STIKER (Gambar & Video)
    // ==========================================
    else if (msg.hasMedia && bodyLower === '!stiker') {
        try {
            const chat = await msg.getChat();

            if (msg.type === 'video' || msg.type === 'gif') {
                await chat.sendStateRecording();
                console.log("Menerima video! Memproses stiker bergerak...");
            } else {
                await chat.sendStateTyping();
                console.log("Menerima gambar! Memproses stiker...");
            }

            const media = await msg.downloadMedia();
            await sleep(getRandomDelay());

            await client.sendMessage(msg.from, media, {
                sendMediaAsSticker: true,
                stickerName: "Standard Style",
                stickerAuthor: "Orion Project"
            });
            console.log("Stiker berhasil terkirim!");
        } catch (error) {
            console.error("Wah, ada error saat membuat stiker:", error);
            await replyWithDelay(msg, "Maaf, ukuran videonya mungkin terlalu besar atau durasinya kepanjangan. Coba potong videonya ya!");
        }
    }

    // ==========================================
    // 3. FITUR BRAT STIKER (!brat <teks>)
    // ==========================================
    else if (bodyLower.startsWith('!brat ')) {
        const teksBrat = body.slice(6).trim();

        if (!teksBrat) return await replyWithDelay(msg, "Kasih teksnya dong!!");
        if (teksBrat.length > 250) return await replyWithDelay(msg, "Teksnya kepanjangan! Maksimal 250 karakter yaa");

        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            const browser = client.pupBrowser;
            const page = await browser.newPage();
            await page.setViewport({ width: 600, height: 600 });

            const fileUrl = `file://${path.resolve(__dirname, 'brat.html')}`;
            await page.goto(fileUrl, { waitUntil: 'networkidle0' });

            await page.evaluate((teks) => {
                document.getElementById('brat-text').innerText = teks;
            }, teksBrat);

            await new Promise(r => setTimeout(r, 100));
            const element = await page.$('#output');
            const screenshotBase64 = await element.screenshot({ encoding: 'base64' });
            await page.close();

            const media = new MessageMedia('image/png', screenshotBase64);

            await sleep(getRandomDelay());
            await client.sendMessage(msg.from, media, {
                sendMediaAsSticker: true,
                stickerName: "Brat Style",
                stickerAuthor: "Orion Project"
            });
            console.log(`[SUKSES] Stiker Brat: "${teksBrat}" terkirim!`);

        } catch (error) {
            console.error("Wah, ada error saat render Brat:", error);
            await replyWithDelay(msg, "Maaf, bot gagal memproses stiker Brat-nya. Coba sebentar lagi ya!");
        }
    }

    // ==========================================
    // 4. FITUR TANYA AI (!tanya <pertanyaan>)
    // ==========================================
    else if (bodyLower.startsWith('!tanya ')) {
        const pertanyaan = body.slice(7).trim();
        if (!pertanyaan) return await replyWithDelay(msg, "Mau nanya apa?");

        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping(); // Indikator mengetik menyala saat AI mikir

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Kamu adalah asisten bot WhatsApp Orion Project yang diciptakan oleh Ki. Kamu pintar, membantu, dan menggunakan bahasa Indonesia yang santai." },
                    { role: "user", content: pertanyaan }
                ],
                model: "openai/gpt-oss-120b",
            });

            const teksJawaban = chatCompletion.choices[0]?.message?.content || "Maaf, aku bingung mau jawab apa.";
            await replyWithDelay(msg, `*[ 𝐎𝐑𝐈𝐎𝐍 𝐀𝐈  ]*\n\n${teksJawaban}${footer}`);
            console.log(`[SUKSES] Jawaban AI terkirim ke ${msg.from}`);

        } catch (error) {
            console.error("Error Groq:", error);
            await replyWithDelay(msg, "Aduh, Orion lagi sibuk nih. Coba tanya lagi ya!");
        }
    }

    // ==========================================
    // FITUR TEXT TO SPEECH / VOICE NOTE (!vn)
    // ==========================================
    else if (bodyLower.startsWith('!vn ')) {
        const teks = body.slice(4).trim();

        if (!teks) return await replyWithDelay(msg, "Kasih teks yang mau diubah jadi suara dong!");
        if (teks.length > 200) return await replyWithDelay(msg, "Teksnya kepanjangan, maksimal 200 karakter ya!");

        try {
            // Kita panggil library-nya di dalam sini saja agar hemat RAM
            const googleTTS = require('google-tts-api');

            // 1. Dapatkan URL audio dari Google TTS (Bahasa Indonesia)
            const url = googleTTS.getAudioUrl(teks, {
                lang: 'id',
                slow: false,
                host: 'https://translate.google.com',
            });

            // 2. Ambil audio menggunakan MessageMedia dari URL
            const media = await MessageMedia.fromUrl(url, { unsafeMime: true });

            // 3. Tambahkan jeda natural
            await sleep(getRandomDelay());

            // 4. Kirim sebagai Voice Note (PTT)
            await client.sendMessage(msg.from, media, {
                sendAudioAsVoice: true // <--- Ini kuncinya biar jadi Voice Note (biru), bukan file musik
            });

            console.log(`[SUKSES] TTS: "${teks}" dikirim ke ${msg.from}`);

        } catch (error) {
            console.error("Error TTS:", error);
            await replyWithDelay(msg, "Aduh, bot-nya lagi serak nih. Gagal ngubah jadi suara.");
        }
    }

    // ==========================================
    // FITUR TIKTOK VIDEO DOWNLOADER (!tt)
    // ==========================================
    else if (bodyLower.startsWith('!tt ')) {
        const link = body.slice(4).trim();

        let parsedUrl;
        try {
            parsedUrl = new URL(link);
        } catch {
            return await replyWithDelay(msg, "Format link tidak valid. Pastikan diawali dengan http atau https ya.");
        }

        if (!parsedUrl.hostname.includes('tiktok.com')) {
            return await replyWithDelay(msg, "Kirim link TikTok yang bener ya!");
        }

        try {
            await replyWithDelay(msg, "Sabar, Orion lagi ngunduh videonya (tanpa watermark)... ⏳");

            // Panggil API TikWM
            const res = await axios.get(`https://www.tikwm.com/api/?url=${link}`, { timeout: 25000 });
            const data = res.data.data;

            // Cek apakah API mengembalikan URL video (data.play)
            if (data && data.play) {
                const videoUrl = data.play;

                // Ubah URL menjadi format Media untuk dikirim via WhatsApp
                const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

                // Tunggu sebentar biar natural
                await sleep(getRandomDelay());

                // Kirim video ke user
                await client.sendMessage(msg.from, media, {
                    caption: `🎬 *TikTok Video Downloaded!*\n\n📝 *Caption:* ${data.title}${footer}`
                });
                console.log(`[SUKSES] Video TikTok terkirim ke ${msg.from}`);
            } else {
                await replyWithDelay(msg, "Gagal mengambil video. Mungkin akunnya di-private atau videonya sudah dihapus.");
            }
        } catch (error) {
            console.error("Error TikTok Video:", error.message);
            await replyWithDelay(msg, "Aduh, server bot lagi sibuk atau koneksi bermasalah. Coba lagi nanti ya!");
        }
    }

    // ==========================================
    // FITUR TIKTOK TO MP3 (!ttmp3)
    // ==========================================
    else if (bodyLower.startsWith('!ttmp3 ')) {
        const link = body.slice(7).trim();

        let parsedUrl;
        try {
            parsedUrl = new URL(link);
        } catch {
            return await replyWithDelay(msg, "Format link tidak valid.");
        }

        if (!parsedUrl.hostname.includes('tiktok.com')) return await replyWithDelay(msg, "Kirim link TikTok yang bener ya!");

        try {
            await replyWithDelay(msg, "Sabar, Orion lagi ambilin audionya...");
            const res = await axios.get(`https://www.tikwm.com/api/?url=${link}`, { timeout: 25000 });
            const data = res.data.data;

            if (data && data.music) {
                const audioUrl = data.music;
                const media = await MessageMedia.fromUrl(audioUrl, { unsafeMime: true });

                await sleep(getRandomDelay());
                await client.sendMessage(msg.from, media, {
                    sendAudioAsVoice: false,
                    caption: `✅ *TikTok MP3 Berhasil!* \n🎵 *Judul:* ${data.music_info.title}${footer}`
                });
                console.log(`[SUKSES] TikTok MP3 terkirim ke ${msg.from}`);
            } else {
                console.warn(`[WARN] Gagal ambil audio TikTok (Private/Deleted): ${link}`);
                await replyWithDelay(msg, "Gagal ambil audio, mungkin link-nya private.");
            }
        } catch (error) {
            console.error(error);
            await replyWithDelay(msg, "Aduh, ada masalah pas ambil audio TikTok.");
        }
    }

    // ==========================================
    // FITUR YT DOWNLOADER (yt-dlp)
    // ==========================================
    else if (bodyLower.startsWith('!ytmp3 ')) {
        const link = body.slice(4).trim();
        if (!link) return await replyWithDelay(msg, "Kirim linknya! Contoh: !ytmp3 https://youtu.be/...");

        try {
            const parsedUrl = new URL(link);
            if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
                return await replyWithDelay(msg, "Link harus menggunakan http atau https.");
            }
        } catch {
            return await replyWithDelay(msg, "Format link tidak valid.");
        }

        try {
            await replyWithDelay(msg, "Mendeteksi link dan memproses audio pakai yt-dlp... ⏳\n(Ini mungkin memakan waktu sebentar)");

            const fileName = `audio_${Date.now()}.mp3`;
            const outputPath = path.join(__dirname, fileName);

            await youtubedl(link, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: outputPath,
                noCheckCertificates: true,
                noWarnings: true,
                noPlaylist: true,
                preferFreeFormats: true,
                ffmpegLocation: FFMPEG_DIR
            });

            if (fs.existsSync(outputPath)) {
                const fileStat = await fsp.stat(outputPath);
                if (fileStat.size > MAX_DOWNLOADED_AUDIO_BYTES) {
                    await fsp.unlink(outputPath);
                    return await replyWithDelay(msg, "File audio terlalu besar untuk dikirim. Coba video yang lebih pendek.");
                }

                const media = MessageMedia.fromFilePath(outputPath);
                await sleep(getRandomDelay());
                await client.sendMessage(msg.from, media, {
                    sendAudioAsVoice: false,
                    caption: `✅ *Download Selesai!*\n\n> ⓘ 𝖮𝗋𝗂𝗈𝗇-𝖡𝗈𝗍`
                });

                await fsp.unlink(outputPath);
                console.log(`[SUKSES] YouTube MP3 terkirim ke ${msg.from}`);
            } else {
                console.warn(`[WARN] Gagal mengunduh yt-dlp file dari: ${link}`);
                await replyWithDelay(msg, "Gagal mengunduh! Coba periksa lagi link yang kamu kirim.");
            }

        } catch (error) {
            console.error("yt-dlp Error:", error);
            await replyWithDelay(msg, "Waduh, terjadi kesalahan. Pastikan link-nya valid dan tidak diprivat!");
        }
    }

    // ==========================================
    // FITUR FACEBOOK TO MP3 (!fbmp3)
    // ==========================================
    else if (bodyLower.startsWith('!fbmp3 ')) {
        const link = body.slice(7).trim();

        // Validasi dasar link Facebook
        if (!link.includes('facebook.com') && !link.includes('fb.watch') && !link.includes('fb.gg')) {
            return await replyWithDelay(msg, "Kirim link Facebook yang bener ya!");
        }

        try {
            await replyWithDelay(msg, "Mengekstrak audio dari Facebook, tunggu sebentar... ⏳");

            // Bikin nama file unik
            const fileName = `fb_audio_${Date.now()}.mp3`;
            const outputPath = path.join(__dirname, fileName);

            // Eksekusi yt-dlp menggunakan FFMPEG_DIR yang sudah kita perbaiki tadi
            await youtubedl(link, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: outputPath,
                noCheckCertificates: true,
                noWarnings: true,
                preferFreeFormats: true,
                ffmpegLocation: FFMPEG_DIR
            });

            // Cek keberhasilan file
            if (fs.existsSync(outputPath)) {
                // Cek ukuran file (batas aman WA sekitar 16-18 MB)
                const fileStat = await fsp.stat(outputPath);
                if (fileStat.size > MAX_DOWNLOADED_AUDIO_BYTES) {
                    await fsp.unlink(outputPath);
                    return await replyWithDelay(msg, "File audionya terlalu besar untuk dikirim WhatsApp. Coba video yang durasinya lebih pendek.");
                }

                // Kirim media
                const media = MessageMedia.fromFilePath(outputPath);
                await sleep(getRandomDelay()); // Jeda sebelum mengirim file
                await client.sendMessage(msg.from, media, {
                    sendAudioAsVoice: false, // false = kirim sebagai file musik
                    caption: `✅ *Facebook MP3 Berhasil!*\n\n> ⓘ 𝖮𝗋𝗂𝗈𝗇-𝖡𝗈𝗍`
                });

                // Hapus file dari penyimpanan laptop/Termux setelah sukses terkirim
                await fsp.unlink(outputPath);
                console.log(`[SUKSES] Facebook MP3 terkirim ke ${msg.from}`);
            } else {
                await replyWithDelay(msg, "Gagal mengambil audio. Pastikan video Facebook tersebut disetel ke Publik (bukan Private) ya.");
            }

        } catch (error) {
            console.error("Facebook MP3 Error:", error.message);
            await replyWithDelay(msg, "Waduh, terjadi kesalahan saat mengunduh audio. Pastikan linknya benar dan videonya tidak diprivat!");
        }
    }

    // ==========================================
    // FITUR INSTAGRAM DOWNLOADER (!ig)
    // Mendukung: Reels, Video Post, & IGTV
    // ==========================================
    else if (bodyLower.startsWith('!ig ')) {
        const link = body.slice(4).trim();

        // Validasi link Instagram
        if (!link.includes('instagram.com')) {
            return await replyWithDelay(msg, "Kirim link Instagram yang bener ya!");
        }

        try {
            await replyWithDelay(msg, "Orion lagi nyari videonya di Instagram... ⏳");

            // Nama file video sementara
            const fileName = `ig_video_${Date.now()}.mp4`;
            const outputPath = path.join(__dirname, fileName);

            // Eksekusi yt-dlp untuk ambil video (format mp4)
            await youtubedl(link, {
                format: 'mp4',
                output: outputPath,
                noCheckCertificates: true,
                noWarnings: true,
                noPlaylist: true,
                ffmpegLocation: FFMPEG_DIR
            });

            // Cek apakah file video berhasil diunduh
            if (fs.existsSync(outputPath)) {
                const fileStat = await fsp.stat(outputPath);

                // Cek ukuran (Video IG kadang gede, kita batasi misal 16MB)
                if (fileStat.size > 16 * 1024 * 1024) {
                    await fsp.unlink(outputPath);
                    return await replyWithDelay(msg, "Wah, videonya kegedean buat dikirim lewat WhatsApp. Coba link yang lain ya!");
                }

                // Kirim Video ke WhatsApp
                const media = MessageMedia.fromFilePath(outputPath);
                await sleep(getRandomDelay()); // Biar makin natural

                await client.sendMessage(msg.from, media, {
                    caption: `✅ *Instagram Video Downloaded!*\n\n> ⓘ 𝖮𝗋𝗂𝗈𝗇-𝖡𝗈𝗍`
                });

                // Hapus file setelah terkirim
                await fsp.unlink(outputPath);
                console.log(`[SUKSES] IG Video terkirim ke ${msg.from}`);
            } else {
                await replyWithDelay(msg, "Gagal ambil video. Pastikan akun IG tersebut tidak di-private ya!");
            }

        } catch (error) {
            console.error("IG Download Error:", error.message);
            await replyWithDelay(msg, "Waduh, sepertinya Instagram lagi proteksi link ini atau server lagi sibuk. Coba lagi nanti!");
        }
    }

    // ==========================================
    // FITUR SOUNDCLOUD DOWNLOADER (!soundcloud)
    // ==========================================
    else if (bodyLower.startsWith('!soundcloud ')) {
        const query = body.slice(12).trim();
        if (!query) return await replyWithDelay(msg, "Mau cari lagu apa? Contoh: !soundcloud Heavy Metal");

        try {
            await replyWithDelay(msg, `Sabar ya, Orion lagi nyari "${query}" di SoundCloud... 🔍`);

            const fileName = `sc_${Date.now()}.mp3`;
            const outputPath = path.join(__dirname, fileName);

            // Kita pakai prefix 'scsearch1:' untuk ambil hasil pertama yang paling relevan
            await youtubedl(`scsearch1:${query}`, {
                extractAudio: true,
                audioFormat: 'mp3',
                output: outputPath,
                noCheckCertificates: true,
                noWarnings: true,
                ffmpegLocation: FFMPEG_DIR // Memakai jalur Scoop kamu
            });

            if (fs.existsSync(outputPath)) {
                const fileStat = await fsp.stat(outputPath);

                // Cek ukuran (SoundCloud biasanya kecil, tapi buat jaga-jaga)
                if (fileStat.size > MAX_DOWNLOADED_AUDIO_BYTES) {
                    await fsp.unlink(outputPath);
                    return await replyWithDelay(msg, "Wah, durasi lagunya kepanjangan buat dikirim lewat WhatsApp.");
                }

                const media = MessageMedia.fromFilePath(outputPath);
                await sleep(getRandomDelay());

                await client.sendMessage(msg.from, media, {
                    sendAudioAsVoice: false,
                    caption: `🎵 *SoundCloud Download:* ${query}${footer}`
                });

                await fsp.unlink(outputPath);
                console.log(`[SUKSES] SoundCloud: ${query} terkirim!`);
            } else {
                await replyWithDelay(msg, "Duh, lagunya nggak ketemu atau gagal didownload.");
            }

        } catch (error) {
            console.error("SoundCloud Error:", error.message);
            await replyWithDelay(msg, "Gagal memproses permintaan SoundCloud. Coba kata kunci lain ya!");
        }
    }

    // ==========================================
    // 5. FITUR JADWAL INTERAKTIF
    // ==========================================
    else if (bodyLower.startsWith('!jadwal')) {
        const args = body.split(' ');
        try {
            const dataJadwal = await loadJadwal();
            const hariDaftar = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
            const hariIni = new Date().getDay();
            let targetHari = hariDaftar[hariIni];

            if (args[1] === 'besok') targetHari = hariDaftar[(hariIni + 1) % 7];
            else if (args[1] && hariDaftar.includes(args[1].toLowerCase())) targetHari = args[1].toLowerCase();

            const listMapel = dataJadwal[targetHari] || [];
            let teksJadwal = `📅 *JADWAL PELAJARAN: ${targetHari.toUpperCase()}*\n\n`;
            listMapel.forEach((mapel, index) => { teksJadwal += `${index + 1}. ${mapel}\n`; });

            await replyWithDelay(msg, teksJadwal + footer);
            console.log(`[SUKSES] Jadwal ${targetHari} terkirim ke ${msg.from}`);
        } catch (e) {
            console.error("[ERROR] Gagal memuat jadwal:", e.message);
            await replyWithDelay(msg, "Buat dulu file jadwal.json ya!");
        }
    }

    // ==========================================
    // FITUR DAFTAR REMINDER OTOMATIS
    // ==========================================
    else if (bodyLower === '!ajukan') {
        const userChatId = msg.from;

        try {
            const listPenerima = await loadPenerima();

            if (listPenerima.includes(userChatId)) {
                return await replyWithDelay(msg, `Kamu sudah terdaftar di database reminder! Tunggu saja jam 05:30 pagi besok. 🔔`);
            }

            listPenerima.push(userChatId);
            await savePenerima(listPenerima);

            await replyWithDelay(msg, "✅ *PENDAFTARAN BERHASIL!*\n\nID kamu telah dicatat. Mulai besok, bot akan mengirimkan jadwal pelajaran otomatis setiap jam 05:30 WIB." + footer);
            console.log(`[DATABASE] ID Baru Terdaftar untuk pengingat jadwal: ${userChatId}`);

        } catch (error) {
            console.error("[ERROR] Terjadi kesalahan pendaftaran Jadwal:", error.message);
            await replyWithDelay(msg, "Waduh, ada masalah saat mendaftarkan ID kamu. Coba lagi nanti ya!");
        }
    }

    // ==========================================
    // FITUR AI TASK SUMMARIZER (OCR + AI)
    // ==========================================
    else if (msg.hasMedia && bodyLower.startsWith('!sum')) {
        try {
            await replyWithDelay(msg, "Sedang membaca teks dari gambar, mohon tunggu... ⏳");

            const media = await msg.downloadMedia();
            if (!media || !media.data) {
                return await replyWithDelay(msg, "Media tidak berhasil dibaca. Coba kirim ulang gambarnya ya.");
            }

            const mediaBytes = estimateBase64Bytes(media.data);
            if (mediaBytes > MAX_SUM_MEDIA_BYTES) {
                return await replyWithDelay(msg, "Ukuran gambar terlalu besar untuk diproses. Maksimal 6 MB ya.");
            }

            const imageBuffer = Buffer.from(media.data, 'base64');
            const ocrResult = await withTimeout(
                Tesseract.recognize(imageBuffer, 'ind+eng', { logger: () => { } }),
                OCR_TIMEOUT_MS,
                'OCR timeout'
            );

            const text = ocrResult?.data?.text;
            if (!text || text.trim().length < 10) {
                return await replyWithDelay(msg, "Maaf, Orion tidak bisa mendeteksi teks yang jelas di gambar tersebut.");
            }

            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: "Kamu adalah asisten pengolah tugas. Berikut adalah teks hasil scan OCR dari sebuah gambar tugas atau catatan. Tolong rangkum poin-poin pentingnya dengan jelas dan mudah dipahami dalam bahasa Indonesia."
                    },
                    { role: "user", content: `Teks hasil scan: ${text}` }
                ],
                model: "openai/gpt-oss-120b",
            });

            const ringkasan = chatCompletion.choices[0]?.message?.content || "Gagal membuat ringkasan.";
            await replyWithDelay(msg, `📝 *HASIL RANGKUMAN TUGAS*\n\n${ringkasan}${footer}`);
            console.log("[SUKSES] OCR & Summarize berhasil dijalankan.");

        } catch (error) {
            console.error("Error OCR/Summarizer:", error);
            await replyWithDelay(msg, "Terjadi kesalahan saat memproses gambar atau merangkum teks.");
        }
    }


    // ==========================================
    // FITUR CEK ID
    // ==========================================
    else if (body === '!myid') {
        await replyWithDelay(msg, `ID Chat ini adalah: ${msg.from}`);
        console.log(`[SUKSES] Info ID Chat terkirim ke ${msg.from}`);
    }

    // ==========================================
    // FITUR KILL SWITCH (Matikan Server Bot)
    // ==========================================
    else if (bodyLower === '!deactivate') {
        if (msg.from === OWNER_ID) {
            await replyWithDelay(msg, "Sistem Orion dinonaktifkan. Sampai jumpa, Ki! 💤");
            console.log(`[SYSTEM] Bot dimatikan secara paksa oleh Owner (${msg.from}) via chat.`);

            await client.destroy();
            process.exit(0);
        } else {
            console.warn(`[WARN] Upaya deactive ilegal oleh ${msg.from}`);
            await replyWithDelay(msg, "⚠️ Akses ditolak! Perintah ini hanya bisa dijalankan oleh Creator.");
        }
    }

    // ==========================================
    // HIDDEN EASTER EGGS (V6)
    // ==========================================
    else if (bodyLower === '1033') {
        await replyWithDelay(msg, "Eh, kamu tahu angka favorit Ki? 😉 Hint: Ini adalah kunci rahasia Orion Project." + footer);
        console.log(`[SUKSES] Easter Egg "1033" dipicu oleh ${msg.from}`);
    }

    // ==========================================
    // SPECIAL GREETING FOR HER (DAILY LIMIT)
    // ==========================================
    else if ((bodyLower.includes('hei') || bodyLower.includes('halo')) && msg.from === nadiaID) {
        try {
            const lastGreetings = await loadLastGreetings();
            const today = new Date().toLocaleDateString('en-CA'); // Format: YYYY-MM-DD

            // Cek apakah Nadia sudah disapa hari ini
            if (lastGreetings[msg.from] !== today) {
                // Beri balasan
                await replyWithDelay(msg, "Haloo! Kamu pasti Princess Rajinn ya? 👋 Semangat terus ya harinya! Ada yang bisa aku bantu?" + footer);

                // Simpan tanggal hari ini ke "ingatan" bot
                lastGreetings[msg.from] = today;
                await saveLastGreetings(lastGreetings);

                console.log(`[SYSTEM] Sapaan harian untuk Nadia terkirim.`);
            } else {
                // Jika sudah pernah chat hari ini, bot diam saja (sesuai request)
                console.log(`[SYSTEM] Nadia chat lagi, tapi bot tetap diam sesuai limit harian.`);
            }
        } catch (error) {
            console.error("Error Greeting Limit:", error);
        }
    }

    // ==========================================
    // FITUR CONTEXTUAL CHAT (NON-COMMAND & CHAINING)
    // Khusus Nadia, bisa berbalas-balasan terus!
    // ==========================================
    else if (!body.startsWith('!')) {
        // Mendapatkan ID kamu sendiri secara dinamis
        const myID = client.info.wid._serialized;

        // Validasi: Harus Nadia OR Kamu sendiri, DAN harus me-reply pesan
        if ((msg.from === nadiaID || msg.from === myID) && msg.hasQuotedMsg) {
            const quotedMsg = await msg.getQuotedMessage();

            if (quotedMsg.fromMe) {
                const qBody = quotedMsg.body;

                // Marker yang diizinkan untuk memicu balasan AI
                const isNonTriggerResponse = qBody.includes("Princess Rajinn") ||
                    qBody.includes("Orion AUTO-CARE") ||
                    qBody.includes("angka favorit Ki") ||
                    qBody.includes("𝖮𝗋𝗂𝗈𝗇-𝖢𝗁𝖺𝗍");

                if (isNonTriggerResponse) {
                    try {
                        // --- MEMORY LOADING (Pastikan ini sudah benar) ---
                        let herMemory = "";
                        const memoryPath = path.join(__dirname, 'her_memory.json');
                        if (fs.existsSync(memoryPath)) {
                            const rawMemory = await fsp.readFile(memoryPath, 'utf8');
                            const memoryObj = JSON.parse(rawMemory);
                            herMemory = `
    - Karakteristik Nadia: ${memoryObj.karakteristik.join(", ")}.
    - Fakta dari Iki tentang Nadia: ${memoryObj.poin_cerita_iki.join(" ")}.
    - Instruksi Iki untuk Orion: ${memoryObj.catatan_interaksi.pesan_iki}.
    `;
                        }

                        const chat = await msg.getChat();
                        await chat.sendStateTyping();

                        const targetName = (msg.from === myID) ? "Nadia (Test Mode)" : "Nadia";

                        // --- PANGGILAN API GROQ DENGAN PROMPT BARU ---
                        const chatCompletion = await groq.chat.completions.create({
                            messages: [
                                {
                                    role: "system",
                                    content: `
IDENTITASMU:
Namamu adalah Orion. Kamu adalah asisten AI cerdas milik Rix (Iki).
Kamu BUKAN manusia, BUKAN Iki, dan BUKAN Nadia.

IDENTITAS LAWAN BICARAMU:
Kamu sedang mengobrol dengan ${targetName}.

DATA MEMORI TENTANG NADIA:
(PERINGATAN SISTEM: Di dalam data berikut, kata "kamu", "mu", atau "Nadia" merujuk pada LAWAN BICARAMU, BUKAN dirimu. Jangan pernah mengakui sifat, hobi, atau barang milik Nadia sebagai milikmu!)
${herMemory}

TUGASMU:
1. Jika ditanya "kamu siapa", perkenalkan dirimu murni sebagai Orion, asisten Iki yang ditugaskan untuk membantu Nadia belajar.
2. Jika ditanya "kenapa Iki buat kamu", jawablah karena Iki peduli pada Nadia dan ingin Orion menemani Nadia agar ritme belajarnya terjaga.
3. Gunakan fakta di atas (seperti stiker kucing, Gustin, takut cicak, dsb) HANYA jika Nadia bertanya apa yang Iki pikirkan/ceritakan tentangnya.
4. Jawab dengan gaya bahasa asisten yang ramah, sedikit gaul, tapi tetap sopan. Jangan panggil dirimu dengan kata-kata Nadia (anuan, ituan).
`
                                },
                                { role: "assistant", content: qBody },
                                { role: "user", content: body }
                            ],
                            model: "openai/gpt-oss-120b",
                        });

                        const teksJawaban = chatCompletion.choices[0]?.message?.content || "Hmm, koneksiku agak error nih, Nad.";

                        await replyWithDelay(msg, teksJawaban + "\n\n> 💬 𝖮𝗋𝗂𝗈𝗇-𝖢𝗁𝖺𝗍");
                        console.log(`[TEST/EXCLUSIVE] Orion membalas chat dari ${msg.from === myID ? 'Owner (Test)' : 'Nadia'}`);
                    } catch (error) {
                        console.error("Error Testing Chat:", error);
                    }
                }
            }
        }
    }

});

// LOGIKA REMINDER OTOMATIS
cron.schedule('30 5 * * *', async () => {
    try {
        const listPenerima = await loadPenerima();
        if (listPenerima.length === 0) return console.log("Belum ada member yang daftar.");

        const dataJadwal = await loadJadwal();
        const hariDaftar = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
        const hariIni = hariDaftar[new Date().getDay()];
        const listMapel = dataJadwal[hariIni] || [];

        let pesan = `🔔 *PENGINGAT OTOMATIS Orion*\n\nSelamat pagi! Hari ini adalah hari *${hariIni.toUpperCase()}*.\n\nJadwal XI PPLG hari ini:\n`;
        listMapel.forEach((mapel, index) => {
            pesan += `${index + 1}. ${mapel}\n`;
        });
        pesan += `\n_Semangat belajarnya!_`;

        for (const id of listPenerima) {
            await client.sendMessage(id, pesan);
            await sleep(2500);
        }
        console.log(`Reminder terkirim ke ${listPenerima.length} member.`);
    } catch (error) {
        console.error('Cron Error:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Jakarta"
});

const initializeClientWithRetry = async (maxAttempts = 5) => {
    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            await client.initialize();
            return;
        } catch (error) {
            console.error(`[SYSTEM] Inisialisasi gagal (percobaan ${attempt}/${maxAttempts}):`, error.message || error);
            if (attempt === maxAttempts) {
                console.error('[SYSTEM] Semua percobaan inisialisasi gagal.');
                return;
            }

            const backoffMs = Math.min(attempt * 5000, 20000);
            await sleep(backoffMs);
        }
    }
};

initializeClientWithRetry();