function updateClocks() {
    const now = new Date();

    // 1. Rendszeridő
    const sysEl = document.getElementById('system-time');
    if (sysEl) {
        sysEl.textContent = now.toLocaleTimeString('hu-HU');
    }

    // 2. HTML GENERÁLÁS ADATOKKAL
    const templatePath = path.join(__dirname, 'index.template.html');
    const targetHtmlPath = path.join(__dirname, 'index.html');

    if (fs.existsSync(templatePath)) {
        let html = fs.readFileSync(templatePath, 'utf8');

        // HTML kártyák összeállítása a results tömbből
        const parkingCardsHtml = results.map(p => `
        <div class="card">
            <div class="card-header">
            <span class="label">${p.label}</span>
            <span class="spots">${p.free} / ${p.total}</span>
            </div>
            <div class="progress-bar">
            <div class="progress" style="width: ${(p.free / p.total) * 100}%"></div>
            </div>
            <div class="card-footer">
            <span>Frissítve: ${p.updated}</span>
            </div>
        </div>
        `).join('');

        // A sablonban lévő <main id="list"></main> tartalmának kicserélése
        html = html.replace('<main id="list">', `<main id="list">${parkingCardsHtml}`);

        // A generálás idejének beírása a data-generated attribútumba (a script.js-nek)
        html = html.replace('id="data-age" data-generated=""', `id="data-age" data-generated="${budapestTimeStr}"`);

        fs.writeFileSync(targetHtmlPath, html);
        console.log('✅ index.html legenerálva hardkódolt adatokkal.');
    }

    // 3. Kártyák frissítése
    document.querySelectorAll('.card-meta').forEach(meta => {
        const cardGenStr = meta.getAttribute('data-generated') || (ageEl ? ageEl.getAttribute('data-generated') : null);
        if (cardGenStr && cardGenStr !== "---") {
            const t = cardGenStr.split(/[- :]/);
            const cardDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
            const diffMin = Math.floor((now - cardDate) / 60000);
            meta.textContent = diffMin <= 0 ? "Frissítve: most" : `Frissítve: ${diffMin} perce`;
        }
    });
}

setInterval(updateClocks, 1000);
updateClocks();

// Frissítés gomb cache-kerüléssel
document.getElementById('refreshBtn')?.addEventListener('click', function () {
    this.textContent = "Töltés...";
    const url = new URL(window.location.href);
    url.searchParams.set('t', new Date().getTime());
    window.location.href = url.toString();
});