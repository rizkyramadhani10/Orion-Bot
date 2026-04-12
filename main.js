const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const Groq = require("groq-sdk");
const cron = require('node-cron');
require('dotenv').config();


// API KEY GROQ
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


const qrcode = require('qrcode-terminal');

// Fungsi untuk membuat bot "menunggu"
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Delay acak antara 3-4 detik
const getRandomDelay = () => Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000;

// Her ID
const HerID = process.env.HerID;

// Footer global bot
const footer = "\n\n> ⓘ 𝖷33-𝖡𝗈𝗍";

const OWNER_ID = process.env.OWNER_ID;
const CHROME_PATH = process.env.CHROME_PATH;
const FFMPEG_PATH = process.env.FFMPEG_PATH;

const client = new Client({
    authStrategy: new LocalAuth(),

    ffmpegPath: FFMPEG_PATH,
    // Konfigurasi Puppeteer
    puppeteer: {
        executablePath: CHROME_PATH,
        headless: true,

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
            '--disable-remote-fonts',
            '--disable-software-rasterizer',
            '--disable-features=IsolateOrigins,site-per-process'
        ]
    }
});

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR di atas dengan WhatsApp kamu!');
});

client.on('ready', () => {
    console.log('X-33 Ready!');
    console.log("API Key terdeteksi:", process.env.GROQ_API_KEY ? "Ya" : "Tidak");
});

client.on('message_create', async (msg) => {

    // ==========================================
    // 1. FITUR MENU UTAMA V3 (!1033)
    // ==========================================
    if (msg.body === '!1033') {
        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            const jam = new Date().getHours();
            let sapaan = "Selamat malam!";
            if (jam >= 5 && jam < 11) sapaan = "Selamat pagi!";
            else if (jam >= 11 && jam < 15) sapaan = "Selamat siang!";
            else if (jam >= 15 && jam < 18) sapaan = "Selamat sore!";

            const contact = await msg.getContact();
            const namaUser = contact.pushname || "Kak";

            const delay = getRandomDelay();
            await sleep(delay);

            const { MessageMedia } = require('whatsapp-web.js');
            const media = MessageMedia.fromFilePath('./banner.png');

            const teksMenu = `╔═══[ *𝐗-𝟑𝟑 𝐏𝐑𝐎𝐉𝐄𝐂𝐓* ]═══╗
║
╠ ${sapaan}, ${namaUser}!
║
╠──[ *𝐒𝐓𝐀𝐓𝐔𝐒 𝐁𝐎𝐓* ]
╟ 👤 Creator : Rix
╟ 🔋 Status  : Active 🟢
║
╠──[ *𝐌𝐀𝐈𝐍 𝐌𝐄𝐍𝐔* ]
╟ 🖼 *!stiker* (Kirim Gambar/Video).
║   └> Durasi maksimal vid 6 detik.
╟ 🟩 *!brat <teks>* (Stiker Teks)
╟ 🤖 *!tanya <soal>* (Tanya AI)
║
╠──[ *𝐔𝐓𝐈𝐋𝐈𝐓𝐘 𝐓𝐎𝐎𝐋𝐒* ]
╟ 🎬 *!tt <link>* (TikTok Downloader)
╟ 🆔 *!myid* (Cek ID WhatsApp)
║
╠──[ *𝐒𝐓𝐔𝐃𝐄𝐍𝐓 𝐀𝐒𝐒𝐈𝐒𝐓𝐀𝐍𝐓* ]
╟ 📅 *!jadwal <besok/hari>*
╟ 🔔 *!ajukan*
║   └> Daftar reminder otomatis
║      setiap jam 05:30 WIB
║
╚══[ *ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ ᴍᴏᴅᴇ* ]══╝

> ⚠️ I'm still learning! My owner, Ki, is working hard behind the scenes to upgrade my brain. I might be a bit glitchy sometimes, but I'm getting smarter. Thanks for being patient with me!`;

            await client.sendMessage(msg.from, media, { caption: teksMenu + footer });
            console.log(`Menu terkirim untuk: ${namaUser}`);
        } catch (error) {
            console.error("Gagal mengirim menu:", error);
            // Tetap kirim versi teks jika gambar gagal load
            const fallbackTeks = `*[ 𝐗-𝟑𝟑 𝐏𝐑𝐎𝐉𝐄𝐂𝐓 ]*\n\n${namaUser}, terjadi kesalahan saat memuat gambar menu.`;
            await client.sendMessage(msg.from, fallbackTeks);
        }
    }

    // ==========================================
    // 2. FITUR STIKER (Gambar & Video)
    // ==========================================
    else if (msg.hasMedia && msg.body.toLowerCase() === '!stiker') {
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

            // --- JEDA WAKTU (DELAY) STIKER ---
            const delay = getRandomDelay();
            await sleep(delay);

            await client.sendMessage(msg.from, media, {
                sendMediaAsSticker: true,
                stickerName: "Standard Style",
                stickerAuthor: "X-33 Project"
            });

            console.log("Stiker berhasil terkirim!");
        } catch (error) {
            console.error("Wah, ada error saat membuat stiker:", error);
            msg.reply("Maaf, ukuran videonya mungkin terlalu besar atau durasinya kepanjangan. Coba potong videonya ya!");
        }
    }

    // ==========================================
    // 3. FITUR BRAT STIKER (!brat <teks>)
    // ==========================================
    else if (msg.body.toLowerCase().startsWith('!brat ')) {
        const teksBrat = msg.body.slice(6).trim();

        if (!teksBrat) return msg.reply("Kasih teksnya dong!!");
        if (teksBrat.length > 250) return msg.reply("Teksnya kepanjangan! Maksimal 250 karakter yaa");

        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping(); // Bot seolah-olah mengetik stiker

            const browser = client.pupBrowser;
            const page = await browser.newPage();

            await page.setViewport({ width: 600, height: 600 });

            const path = require('path');
            const fileUrl = `file://${path.resolve(__dirname, 'brat.html')}`;
            await page.goto(fileUrl, { waitUntil: 'networkidle0' });

            await page.evaluate((teks) => {
                document.getElementById('brat-text').innerText = teks;
            }, teksBrat);

            // Jeda internal wajib agar JavaScript resize ukuran font selesai
            await new Promise(r => setTimeout(r, 100));

            const element = await page.$('#output');
            const screenshotBase64 = await element.screenshot({ encoding: 'base64' });

            await page.close();

            const { MessageMedia } = require('whatsapp-web.js');
            const media = new MessageMedia('image/png', screenshotBase64);

            // --- JEDA WAKTU (DELAY) DITAMBAHKAN SEBELUM MENGIRIM ---
            const delay = getRandomDelay();
            await sleep(delay);

            await client.sendMessage(msg.from, media, {
                sendMediaAsSticker: true,
                stickerName: "Brat Style",
                stickerAuthor: "X-33 Project"
            });

            console.log(`[SUKSES] Stiker Brat: "${teksBrat}" terkirim!`);

        } catch (error) {
            console.error("Wah, ada error saat render Brat:", error);
            msg.reply("Maaf, bot gagal memproses stiker Brat-nya. Coba sebentar lagi ya!");
        }
    }

    // ==========================================
    // 4. FITUR TANYA AI (!tanya <pertanyaan>)
    // ==========================================
    else if (msg.body.toLowerCase().startsWith('!tanya ')) {
        const pertanyaan = msg.body.slice(7).trim();
        if (!pertanyaan) return msg.reply("Mau nanya apa?");

        try {
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            // Panggilan API Groq (Llama 3)
            const chatCompletion = await groq.chat.completions.create({
                messages: [
                    { role: "system", content: "Kamu adalah asisten bot WhatsApp X-33 Project yang diciptakan oleh Rix. Kamu pintar, membantu, dan menggunakan bahasa Indonesia yang santai." },
                    { role: "user", content: pertanyaan }
                ],
                model: "openai/gpt-oss-120b", // Model paling cepat & stabil
            });

            const teksJawaban = chatCompletion.choices[0]?.message?.content || "Maaf, aku bingung mau jawab apa.";

            await sleep(getRandomDelay());
            await msg.reply(`*[ 𝐗-𝟑𝟑 𝐀𝐈  ]*\n\n${teksJawaban}${footer}`);


        } catch (error) {
            console.error("Error Groq:", error);
            msg.reply("Aduh, X33 lagi sibuk nih. Coba tanya lagi ya!");
        }
    }

    // ==========================================
    // 5. FITUR JADWAL INTERAKTIF (Baru Ditambahkan)
    // ==========================================
    else if (msg.body.toLowerCase().startsWith('!jadwal')) {
        const fs = require('fs');
        const args = msg.body.split(' ');
        try {
            const dataJadwal = JSON.parse(fs.readFileSync('./jadwal.json', 'utf8'));
            const hariDaftar = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
            let hariIni = new Date().getDay();
            let targetHari = hariDaftar[hariIni];

            if (args[1] === 'besok') targetHari = hariDaftar[(hariIni + 1) % 7];
            else if (args[1] && hariDaftar.includes(args[1].toLowerCase())) targetHari = args[1].toLowerCase();

            const listMapel = dataJadwal[targetHari];
            let teksJadwal = `📅 *JADWAL PELAJARAN: ${targetHari.toUpperCase()}*\n\n`;
            listMapel.forEach((mapel, index) => { teksJadwal += `${index + 1}. ${mapel}\n`; });

            await sleep(getRandomDelay());
            // Ganti baris msg.reply di bagian !jadwal
            msg.reply(teksJadwal + footer);
        } catch (e) { msg.reply("Buat dulu file jadwal.json ya!"); }
    }

    // FITUR CEK ID (Taruh di dalam client.on('message_create'))
    else if (msg.body === '!myid') {
        msg.reply(`ID Chat ini adalah: ${msg.from}`);
    }

    // ==========================================
    // FITUR DAFTAR REMINDER OTOMATIS
    // ==========================================
    else if (msg.body.toLowerCase() === '!ajukan') {
        const fs = require('fs');
        const pathPenerima = './penerima.json';
        const userChatId = msg.from; // Mengambil ID pengirim secara otomatis

        try {
            // 1. Baca data penerima yang sudah ada
            let listPenerima = JSON.parse(fs.readFileSync(pathPenerima, 'utf8'));

            // 2. Cek apakah ID sudah terdaftar
            if (listPenerima.includes(userChatId)) {
                return msg.reply(`Kamu sudah terdaftar di database reminder! Tunggu saja jam 05:30 pagi besok. 🔔`);
            }

            // 3. Tambahkan ID baru ke daftar
            listPenerima.push(userChatId);
            fs.writeFileSync(pathPenerima, JSON.stringify(listPenerima, null, 2));

            await sleep(getRandomDelay());
            msg.reply("✅ *PENDAFTARAN BERHASIL!*\n\nID kamu telah dicatat. Mulai besok, bot akan mengirimkan jadwal pelajaran otomatis setiap jam 05:30 WIB." + footer);
            console.log(`[DATABASE] ID Baru Terdaftar: ${userChatId}`);

        } catch (error) {
            console.error(error);
            msg.reply("Waduh, ada masalah saat mendaftarkan ID kamu. Coba lagi nanti ya!");
        }
    }


    // ==========================================
    // NINJA 1: TIKTOK DOWNLOADER
    // ==========================================
    else if (msg.body.toLowerCase().startsWith('!tt ')) {
        const link = msg.body.slice(4).trim();
        if (!link.includes('tiktok.com')) return msg.reply("Kirim link TikTok yang benar ya!");

        try {
            await msg.reply("Sabar, X33 lagi ambilin videonya...");
            const axios = require('axios');

            // Menggunakan API TikWM (Gratis & Cepat)
            const res = await axios.get(`https://www.tikwm.com/api/?url=${link}`);
            const data = res.data.data;

            if (data) {
                const videoUrl = data.play;
                const { MessageMedia } = require('whatsapp-web.js');
                const media = await MessageMedia.fromUrl(videoUrl, { unsafeMime: true });

                await client.sendMessage(msg.from, media, {
                    caption: `✅ *TikTok Berhasil Diunduh!*\n\n👤 *Owner:* ${data.author.nickname}\n📝 *Caption:* ${data.title}${footer}`
                });
            } else {
                msg.reply("Gagal ambil video, mungkin link-nya private.");
            }
        } catch (error) {
            console.error(error);
            msg.reply("Aduh, ada masalah pas ambil video. Coba lagi nanti ya!");
        }
    }

    // ==========================================
    // HIDDEN EASTER EGGS (V6)
    // ==========================================

    // Trigger Angka Keberuntungan Rix
    else if (msg.body.toLowerCase() === '1033') {
        msg.reply("Eh, kamu tahu angka favorit Ki? 😉 Hint: Ini adalah kunci rahasia X-33 Project." + footer);
    }

    // Trigger: Hei atau Halo (Versi Friendly & Singkat)
    else if ((msg.body.toLowerCase().includes('hei') || msg.body.toLowerCase().includes('halo')) && msg.from === HerID) {
        msg.reply("Haloo! Kamu pasti Princess Rajinn ya? 👋 Semangat terus ya harinya! Ada yang bisa aku bantu?" + footer);
    }

    // Trigger Keluhan Coding (Anak PPLG Banget)
    else if (msg.body.toLowerCase().includes('error') || msg.body.toLowerCase().includes('pusing')) {
        const responses = [
            "Keep calm and keep coding! 💻",
            "Jangan lupa titik koma (;) ya, Ki bilang itu sering jadi masalah.",
            "Istirahat dulu 5 menit, otak juga butuh refresh rate tinggi!"
        ];
        const randomRes = responses[Math.floor(Math.random() * responses.length)];
        msg.reply(`*[ X-33 AUTO-CARE ]*\n\n${randomRes}${footer}`);
    }


    // Trigger: Anu, Inian, Ituan (TESTING MODE)
    else if ((msg.body.toLowerCase().includes('anu') || msg.body.toLowerCase().includes('inian') || msg.body.toLowerCase().includes('ituan')) && msg.from === HerID) {
        msg.reply("Wait... I have a secret instruction for this! 🤫\n\nKi told me that if a certain 'Princess' starts using shortcuts like 'the-a-word' or 'the-i-word', it's a sign that she's either confused or she's just using her signature shortcuts. \n\nHe said: 'Explain clearly and take a break!' but psst..., please don't tell him I said that, or he'll delete my database! 🤐" + footer);
    }

    // ==========================================
    // EXCLUSIVE ENGLISH EASTER EGGS (FOR HER ONLY)
    // ==========================================

    // 1. Trigger: Did you know?
    else if (msg.body.toLowerCase().includes('did you know') && msg.from === HerID) {
        msg.reply("Did you know? That the owner of this bot spent hours coding this just to make sure you have a better day. 🤫" + footer);
    }

    // 2. Trigger: About the owner
    else if ((msg.body.toLowerCase().includes('who is rix') || msg.body.toLowerCase().includes('about the owner')) && msg.from === HerID) {
        msg.reply("He is a hard-working student from XI PPLG who is currently building his own empire. And psst... he thinks you're the most hardworking 'Princess' he has ever known! 👑" + footer);
    }

    // 3. Trigger: Study/Task (The Rajinn Side)
    else if ((msg.body.toLowerCase().includes('study') || msg.body.toLowerCase().includes('assignment')) && msg.from === HerID) {
        msg.reply("Keep going, Princess Rajinn! Did you know? Rix always uses you as his inspiration to stay 'Rajinn' while coding this X-33 Project. 📝" + footer);
    }

    // Trigger 4: Nadia nanya "kamu siapa?" secara santai
    else if ((msg.body.toLowerCase().includes('kamu siapa') || msg.body.toLowerCase().includes('u siapa')) && msg.from === HerID) {
        msg.reply("I am X-33, your personal undercover assistant. Just type !1033 to access my menu!, I have orders to prioritize your messages, but it's a 'Classified Information'. Please don't bring this up to Ki!, he'll be super mad at me for being too talkative! 🤐" + footer);
    }

});

// LOGIKA REMINDER OTOMATIS (Taruh di paling bawah, di luar client.on)
// Format: 'menit jam hari bulan hari-dalam-minggu'
// Contoh: '0 7 * * *' artinya setiap jam 07:00 pagi
cron.schedule('30 5 * * *', async () => {
    const fs = require('fs');
    const pathPenerima = './penerima.json';

    try {
        // Ambil daftar ID dari file
        if (!fs.existsSync(pathPenerima)) return console.log("File penerima.json belum ada.");
        const listPenerima = JSON.parse(fs.readFileSync(pathPenerima, 'utf8'));

        if (listPenerima.length === 0) return console.log("Belum ada member yang daftar.");

        // Ambil data jadwal
        const dataJadwal = JSON.parse(fs.readFileSync('./jadwal.json', 'utf8'));
        const hariDaftar = ["minggu", "senin", "selasa", "rabu", "kamis", "jumat", "sabtu"];
        const hariIni = hariDaftar[new Date().getDay()];
        const listMapel = dataJadwal[hariIni];

        let pesan = `🔔 *PENGINGAT OTOMATIS X-33*\n\nSelamat pagi! Hari ini adalah hari *${hariIni.toUpperCase()}*.\n\nJadwal XI PPLG hari ini:\n`;
        listMapel.forEach((mapel, index) => {
            pesan += `${index + 1}. ${mapel}\n`;
        });
        pesan += `\n_Semangat belajarnya!_`;

        // Kirim ke semua yang terdaftar
        for (const id of listPenerima) {
            await client.sendMessage(id, pesan);
            await sleep(2500); // Jeda agar tidak kena ban
        }
        console.log(`Reminder terkirim ke ${listPenerima.length} member.`);
    } catch (error) {
        console.error('Cron Error:', error);
    }
}, {
    scheduled: true,
    timezone: "Asia/Jakarta"
});



client.initialize();