# 🌌 Orion-Bot (formerly X33-Bot)

![GitHub stars](https://img.shields.io/github/stars/rizkyramadhani10/Orion-Bot?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/rizkyramadhani10/Orion-Bot?style=for-the-badge&logo=github) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)

## 📝 Description

**Orion-Bot** is a high-performance, multi-functional WhatsApp Bot automation built on the Node.js runtime. Originally known as X33-Bot, it has been heavily refactored to serve as a comprehensive digital assistant. Featuring a sleek terminal-style interface, Orion handles everything from AI-powered contextual conversations and task summarization to high-quality media fetching across various social platforms.

## ✨ Core Features

* **🤖 Advanced AI Integration:** Context-aware conversations using Groq API (LLaMA models) with customizable personality prompts.
* **📥 Media Retriever:** High-speed downloaders for TikTok, Instagram, YouTube (Audio), Facebook, and Soundcloud using `yt-dlp`.
* **🎓 Student Suite:** Built-in utilities for students, including schedule management, task reminders, and OCR-based task summarizers.
* **🎨 Creative Tools:** Instant Image/Video to WebP Sticker conversion and viral "Brat" text-to-sticker generation.
* **🎙️ Utility:** Text-to-Speech (Voice Note) synthesis and user ID fetcher.

## 🛠️ Tech Stack

* **Runtime:** Node.js (v18+ recommended)
* **Core Library:** `whatsapp-web.js`
* **AI Engine:** Groq Cloud API
* **Media Processing:** `fluent-ffmpeg`, `youtube-dl-exec` (yt-dlp)

## ⚙️ Environment Setup (.env)

For security reasons, sensitive data is not uploaded to this repository. You must create a `.env` file in the root directory before starting the bot.

Create a `.env` file and add the following variables:

```env
# Bot Owner & Special Contact
OWNER_ID="your_number@c.us"
HER_ID="target_number@c.us"
HER_NAME="Special Name"
HER_NICKNAME="Special Nickname"
MY_NAME="Your Name"

# Allowed triggers for Contextual AI Chat
ALLOWED_MARKERS="Orion,Chat-AI"
```

## ⚡ Quick Start

```bash
# Clone the repository
git clone https://github.com/rizkyramadhani10/X33-Bot.git

# Install dependencies
npm install

# Start development server
npm run start
```

## 📁 Project Structure

```
.
├── .env                # Environment variables (Ignored by Git)
├── .gitignore          # Git ignore rules
├── banner.png          # Project banner
├── brat.html           # HTML template for Brat sticker generator
├── her_memory.json     # Dynamic AI Context Memory (Ignored by Git)
├── jadwal.json         # Schedule database
├── main.js             # Main application entry point
├── package.json        # Dependencies & Scripts
└── README.md           # Documentation
```
💡 Note on Local Files
Files like jadwal.json and penerima.json are part of the bot's local database. These files are not required to be created manually before the first run, as Orion will handle the data locally. They are excluded from the repository to protect your personal schedule and contact data.

## 👥 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork** the repository
2. **Clone** your fork: `git clone https://github.com/rizkyramadhani10/X33-Bot.git`
3. **Create** a new branch: `git checkout -b feature/your-feature`
4. **Commit** your changes: `git commit -am 'Add some feature'`
5. **Push** to your branch: `git push origin feature/your-feature`
6. **Open** a pull request

Please ensure your code follows the project's style guidelines and includes tests where applicable.

## 📜 License

This project is licensed under the ISC License.
