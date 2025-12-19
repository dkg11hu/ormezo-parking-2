function updateClocks() {
    const now = new Date();

    // 1. Rendszeridő (Felső sor jobb oldal)
    const sysEl = document.getElementById('system-time');
    if (sysEl) {
        sysEl.textContent = `Rendszeridő: ${now.toLocaleTimeString('hu-HU')}`;
    }

    // 2. Jelentés kora (Felső sor bal oldal - ELTELT IDŐ)
    const ageEl = document.getElementById('data-age');
    if (ageEl) {
        const genStr = ageEl.getAttribute('data-generated');
        if (genStr) {
            const t = genStr.split(/[- :]/);
            // Kényszerített helyi idő parse-olás (YYYY, MM-1, DD, HH, MM, SS)
            const genDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

            let diffSec = Math.floor((now - genDate) / 1000);

            // Ha negatív (időzóna eltérés miatt), akkor 0
            if (diffSec < 0) diffSec = 0;

            const m = Math.floor(diffSec / 60);
            const s = diffSec % 60;

            // Csak akkor írunk órát, ha több mint 60 perc
            if (m >= 60) {
                const h = Math.floor(m / 60);
                ageEl.textContent = `Jelentés: ${h}ó ${m % 60}p perce`;
            } else {
                ageEl.textContent = `Jelentés: ${m}p ${s}mp perce`;
            }
        }
    }

    // 3. Kártyák frissítési ideje (Szinkronizálva)
    document.querySelectorAll('.card-meta').forEach(meta => {
        const cardGenStr = meta.getAttribute('data-generated') || (ageEl ? ageEl.getAttribute('data-generated') : null);
        if (cardGenStr) {
            const t = cardGenStr.split(/[- :]/);
            const cardDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);
            const diffMin = Math.floor((now - cardDate) / 60000);

            meta.textContent = diffMin <= 0 ? "Frissítve: most" : `Frissítve: ${diffMin} perce`;
        }
    });
}

// Intervallum beállítása
setInterval(updateClocks, 1000);
updateClocks();

// Frissítés gomb cache-kerüléssel
document.getElementById('refreshBtn')?.addEventListener('click', function () {
    this.textContent = "Töltés...";
    const url = new URL(window.location.href);
    url.searchParams.set('t', new Date().getTime());
    window.location.href = url.toString();
});