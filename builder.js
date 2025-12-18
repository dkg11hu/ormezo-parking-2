const fs = require('fs');
const path = require('path');

// 1. ELÉRÉSI UTAK (Gyökérben keressük a forrást, public-ba írunk)
const templatePath = path.join(__dirname, 'index.template.html');
const dataPath = path.join(__dirname, 'parking-status.json'); // Itt kell lennie a forrásnak
const outputDir = path.join(__dirname, 'public');
const outputPath = path.join(outputDir, 'index.html');

try {
    // 2. ADATOK BEOLVASÁSA (Még a takarítás előtt!)
    if (!fs.existsSync(dataPath)) {
        throw new Error(`A ${dataPath} nem található! Futtasd le az extractor.js-t, és ellenőrizd, hogy a gyökérbe ment-e.`);
    }

    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const template = fs.readFileSync(templatePath, 'utf8');
    const parkingList = rawData.parkings || (Array.isArray(rawData) ? rawData : []);

    // 3. CLEANUP: Csak most ürítjük a public mappát, mert már megvannak az adatok a memóriában
    if (fs.existsSync(outputDir)) {
        fs.rmSync(outputDir, { recursive: true, force: true });
    }
    fs.mkdirSync(outputDir, { recursive: true });

    // 4. HTML GENERÁLÁS (Beégetett adatokkal)
    let cardsHtml = '';
    parkingList.sort((a, b) => b.free - a.free).forEach(p => {
        const percent = Math.round(((p.total - p.free) / p.total) * 100);
        const color = percent > 90 ? '#f85149' : (percent > 70 ? '#d29922' : '#3fb950');
        const timeStr = (p.minutesAgo !== null && p.minutesAgo < 2) ? "Épp most" : `${p.minutesAgo} perce`;

        cardsHtml += `
    <a href="${p.url}" target="_blank" class="parking-card-link">
        <article class="card" style="border-top: 3px solid ${color}">
            <div class="card-top">
                <div class="label">${p.label}</div>
                <div class="numbers">
                    <span class="count" style="color: ${color}">${p.free}</span>
                    <span class="total">/ ${p.total}</span>
                </div>
            </div>
            <div class="bar-container">
                <div class="bar">
                    <div class="fill" style="width:${percent}%; background-color:${color}"></div>
                </div>
                <div class="pct">${percent}%</div>
            </div>
            <div class="card-meta">Frissítve: ${timeStr}</div>
        </article>
    </a>`;
    });

    // 5. BEILLESZTÉS ÉS MENTÉS
    const finalHtml = template
        .replace(/<main id="list">[\s\S]*?<\/main>/, `<main id="list">${cardsHtml}</main>`)
        .replace(/id="report-date"[^>]*>[\s\S]*?<\/div>/, `id="report-date" class="meta">Frissítve: ${rawData.generatedAt || new Date().toLocaleString('hu-HU')}</div>`);

    fs.writeFileSync(outputPath, finalHtml, 'utf8');
    console.log('✅ index.html kész.');

    // 6. ASSETEK MÁSOLÁSA (Saved Information szabály alapján)
    ['style.css', 'script.js', 'favicon.ico'].forEach(file => {
        const src = path.join(__dirname, file);
        const dest = path.join(outputDir, file);
        if (fs.existsSync(src)) {
            fs.copyFileSync(src, dest);
            console.log(`📋 Másolva: ${file}`);
        }
    });

    console.log('✨ Build sikeres a public mappában.');

} catch (err) {
    console.error('❌ Build hiba:', err.message);
    process.exit(1);
}