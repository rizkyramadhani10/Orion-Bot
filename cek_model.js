const API_KEY = "AIzaSyATo9LdIwVdfG5gBjR_gbIPJlj8v4K-TwM";

async function cek() {
    console.log("Menghubungi server Google...");
    try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await res.json();
        
        if (data.error) {
            console.log("Waduh, ada error dari Google:", data.error.message);
            return;
        }

        const models = data.models
            .filter(m => m.supportedGenerationMethods.includes("generateContent"))
            .map(m => m.name.replace('models/', ''));
            
        console.log("\n✅ INI DAFTAR MODEL YANG BISA KAMU PAKAI:");
        models.forEach(m => console.log(`- ${m}`));
        console.log("\nSaran: Pilih yang ada tulisan 'flash' atau 'pro' dan bukan 'preview' jika ada.");
    } catch (e) {
        console.log("Gagal nyambung:", e);
    }
}
cek();
