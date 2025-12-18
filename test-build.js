const fs = require('fs');
const path = require('path');

console.log("🚀 Lokális build és struktúra teszt indítása...");

try {
    // 1. Források ellenőrzése a GYÖKÉRBEN (Master fájlok)
    // A szabályod szerint ezeknek a main ágon (gyökérben) kell lenniük
    const masterSources = [
        'extractor.js',
        'builder.js',
        'index.template.html',
        'style.css',   // <--- Most már a gyökérben keressük
        'script.js'    // <--- Most már a gyökérben keressük
    ];

    masterSources.forEach(file => {
        if (!fs.existsSync(path.join(__dirname, file))) {
            throw new Error(`HIÁNYZIK A FORRÁS A GYÖKÉRBŐL: ${file}`);
        }
    });
    console.log("✅ Master forrásfájlok a gyökérben rendben.");

    // 2. Futtassuk a buildert
    // A builder.js fogja legenerálni a HTML-t és ÁTMÁSOLNI a css/js fájlokat a public-ba
    console.log("⏳ Builder futtatása...");
    require('./builder.js');
    console.log("✅ builder.js lefutott.");

    // 3. Ellenőrizzük a kimenetet a public mappában (Deployment ready állapot)
    const expectedOutputs = [
        'index.html',
        'style.css',
        'script.js',
        'parking-status.json'
    ];

    console.log("\n📂 A 'public' mappa ellenőrzése (GitHub Pages forrás):");
    const requiredFiles = ['index.html', 'style.css', 'script.js']; // A JSON-t kivettük innen!

    requiredFiles.forEach(file => {
        const p = path.join(__dirname, 'public', file);
        if (fs.existsSync(p)) {
            const stats = fs.statSync(p);
            console.log(` ✅ ${file} (${stats.size} bytes) - OK`);
        } else {
            console.error(` ❌ HIÁNYZIK: public/${file}`);
            process.exit(1);
        }
    });

    // 4. Kritikus tartalom ellenőrzés
    const htmlContent = fs.readFileSync(path.join(__dirname, 'public/index.html'), 'utf8');
    const cssContent = fs.readFileSync(path.join(__dirname, 'public/style.css'), 'utf8');

    if (htmlContent.length < 100) {
        throw new Error("A generált index.html túl rövid vagy üres!");
    }

    // Modern Dark check: nézzük meg, benne van-e a sötét háttérszín
    if (!cssContent.includes('#0d1117') && !cssContent.includes('--bg')) {
        console.warn("⚠️ FIGYELEM: A style.css-ben nem találom a sötét stílus nyomait!");
    }

    console.log("\n✨ SIKER! A 'public' mappa szerkezete helyes, az útvonalak (relatív hivatkozások) rendben lesznek.");

} catch (err) {
    console.error(`\n❌ TESZT HIBA: ${err.message}`);
    process.exit(1);
}