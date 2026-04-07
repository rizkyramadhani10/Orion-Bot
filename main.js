const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

// --- BAGIAN FUNGSI TAMBAHAN (Wajib ada agar tidak error) ---

// Fungsi untuk membuat bot "menunggu"
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fungsi untuk menentukan angka acak antara 3-6 detik
const getRandomDelay = () => Math.floor(Math.random() * (6000 - 3000 + 1)) + 3000;

// -----------------------------------------------------------

// ... (bagian require dan fungsi sleep tetap sama seperti sebelumnya) ...

const client = new Client({
    authStrategy: new LocalAuth(),

    ffmpegPath: 'D:/Scoopapp/apps/ffmpeg/current/bin/ffmpeg.exe',

    // TAMBAHKAN KONFIGURASI PUPPETEER DI SINI
    puppeteer: {
        // Ganti 'true' kalau kamu tidak mau jendela Chrome-nya kelihatan
        headless: true,

        // Sesuaikan dengan lokasi Google Chrome di laptopmu!
        // Gunakan garis miring (/) atau garis miring terbalik ganda (\\)
        executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',

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
            // '--blink-settings=imagesEnabled=false',
            '--disable-software-rasterizer',
            '--disable-features=IsolateOrigins,site-per-process' // Tambahan ekstra agar RAM lebih stabil
        ]
    }
});

// ... (kode client.on('qr') dan ke bawahnya tetap sama) ...

client.on('qr', (qr) => {
    qrcode.generate(qr, { small: true });
    console.log('Scan QR di atas dengan WhatsApp kamu!');
});

client.on('ready', () => {
    console.log('Bot sudah siap digunakan!');
});

client.on('message_create', async (msg) => {

    // ==========================================
    // 1. FITUR MENU UTAMA V3 (!1033) - DENGAN DELAY
    // ==========================================
    if (msg.body === '!1033') {
        try {
            // Memanggil fitur "mengetik" di obrolan
            const chat = await msg.getChat();
            await chat.sendStateTyping();

            const jam = new Date().getHours();
            let sapaan = "Selamat malam!";
            if (jam >= 5 && jam < 11) sapaan = "Selamat pagi!";
            else if (jam >= 11 && jam < 15) sapaan = "Selamat siang!";
            else if (jam >= 15 && jam < 18) sapaan = "Selamat sore!";

            const contact = await msg.getContact(); 
            const namaUser = contact.pushname || "Kak"; 

            // --- JEDA WAKTU (DELAY) DITAMBAHKAN DI SINI ---
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
╟ 🖼 *!stiker*
║   └> Kirim Gambar/Video/GIF
╟ 🟩 *!brat <teks>*
║   └> Buat stiker teks ala Brat
╟ ℹ️ *!1033*
║   └> Menampilkan menu ini
║
╚══[ *ᴇxᴘᴇʀɪᴍᴇɴᴛᴀʟ ᴍᴏᴅᴇ* ]══╝

_Note: Maksimal durasi video 6 detik._`;

            await client.sendMessage(msg.from, media, { caption: teksMenu });
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
});

client.initialize();