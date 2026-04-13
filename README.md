# 🌌 Orion-OS (formerly X33-Bot)

![GitHub stars](https://img.shields.io/github/stars/rizkyramadhani10/Orion-project?style=for-the-badge&logo=github) ![GitHub forks](https://img.shields.io/github/forks/rizkyramadhani10/Orion-project?style=for-the-badge&logo=github) ![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white) ![License](https://img.shields.io/badge/license-ISC-green?style=for-the-badge)

## 📝 Description

**Orion-OS** is a high-performance, multi-functional WhatsApp Bot automation built on the Node.js runtime. Originally known as X33-Bot, it has been heavily refactored to serve as a comprehensive digital assistant. Featuring a sleek terminal-style interface, Orion handles everything from AI-powered contextual conversations and task summarization to high-quality media fetching across various social platforms.

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
HER_NAME="Target Name"
HER_NICKNAME="Special Nickname"
MY_NAME="Your Name"

# Allowed triggers for Contextual AI Chat
ALLOWED_MARKERS="Orion,Chat-AI"

## ⚡ Quick Start

# 1. Clone the repository
git clone [https://github.com/rizkyramadhani10/Orion-project.git](https://github.com/rizkyramadhani10/Orion-project.git)

# 2. Enter the directory
cd Orion-project

# 3. Install dependencies
npm install

# 4. Start the bot
npm run start

## 🚀 Run Commands

- **start**: `npm run start`
- **test**: `npm run test`

## 📁 Project Structure

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

---
*This README was generated with ❤️ by [ReadmeBuddy](https://readmebuddy.com)*
