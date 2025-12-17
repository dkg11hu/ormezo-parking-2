const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'index.template.html');
const dataPath = path.join(__dirname, 'public', 'parking-status.json');
const outputPath = path.join(__dirname, 'public', 'index.html');

console.log('BUILDER START: Generating index.html...');

try {
    if (!fs.existsSync(templatePath)) throw new Error('Hiányzik az index.template.html!');
    if (!fs.existsSync(dataPath)) throw new Error('Hiányzik a parking-status.json!');

    const template = fs.readFileSync(templatePath, 'utf8');
    const parkingData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

    // --- KÁRTYÁK GENERÁLÁSA ---
    let cardsHtml = '';
    parkingData.forEach(p => {
        const occupied = p.total - p.free;
        const percent = Math.round((occupied / p.total) * 100);
        const color = percent > 90 ? '#ef4444' : (percent > 70 ? '#eab308' : '#22c55e');

        // Itt hozzuk létre a KATTINTHATÓ kártyát (<a> tag)
        cardsHtml += `
            <a href="${p.url}" target="_blank" class="parking-card" style="border-left: 4px solid ${color}; text-decoration: none; display: block; margin-bottom: 12px; background: #1e293b; padding: 16px; border-radius: 8px;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 10px;">
                    <span style="font-weight:600; color: #fff;">${p.label}</span>
                    <span style="color:${color}; font-weight:bold;">${p.free} szabad</span>
                </div>
                <div style="height:6px; background:#0f172a; border-radius:3px; overflow:hidden;">
                    <div style="width:${percent}%; height:100%; background:${color}; transition: width 0.5s;"></div>
                </div>
                <div style="font-size:0.75rem; color:#94a3b8; margin-top:8px;">
                    Kihasználtság: ${percent}% | Kapacitás: ${p.total}
                </div>
            </a>
        `;
    });

    // 2. Beillesztés a sablonba
    // Keressük meg a <main id="list"></main> részt a sablonban, és tegyük bele a kártyákat
    let finalHtml = template.replace('<main id="list" aria-live="polite">', `<main id="list" aria-live="polite">${cardsHtml}`);

    // 3. Mentés
    fs.writeFileSync(outputPath, finalHtml, 'utf8');

    console.log(`SUCCESS: index.html létrehozva ${parkingData.length} kártyával.`);
} catch (err) {
    console.error('BUILDER ERROR:', err.message);
    process.exit(1);
}