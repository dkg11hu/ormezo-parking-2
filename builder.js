const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'index.template.html');
const dataPath = path.join(__dirname, 'parking-status.json');
const outputDir = path.join(__dirname, 'public');
const outputPath = path.join(outputDir, 'index.html');

try {
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const template = fs.readFileSync(templatePath, 'utf8');
    const parkingList = rawData.parkings || [];

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir);

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
                <div class="bar"><div class="fill" style="width:${percent}%; background-color:${color}"></div></div>
                <div class="pct">${percent}%</div>
            </div>
            <div class="card-meta">Frissítve: ${timeStr}</div>
        </article>
    </a>`;
    });

    // BEILLESZTÉS: Most már az "id=list" és "id=report-date" helyekre szúrunk be
    const finalHtml = template
        .replace(/<main id="list">[\s\S]*?<\/main>/, `<main id="list">${cardsHtml}</main>`)
        .replace(/id="report-date"[^>]*>[\s\S]*?<\/div>/, `id="report-date" class="meta">Adatok: ${rawData.generatedAt}</div>`);

    fs.writeFileSync(outputPath, finalHtml, 'utf8');

    // Assetek másolása
    ['style.css', 'script.js'].forEach(file => {
        const src = path.join(__dirname, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, path.join(outputDir, file));
    });

    console.log('✨ Build sikeres! A public/index.html most már tartalmazza a kártyákat.');

} catch (err) {
    console.error('❌ Hiba:', err.message);
}