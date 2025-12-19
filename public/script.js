function updateClocks() {
    const now = new Date();

    // 1. Rendszeridő frissítése
    const sysEl = document.getElementById('system-time');
    if (sysEl) {
        sysEl.textContent = `Rendszeridő: ${now.toLocaleTimeString('hu-HU')}`;
    }

    // 2. Jelentés kora - PONTOSÍTOTT SZÁMÍTÁS
    const ageEl = document.getElementById('data-age');
    if (ageEl) {
        const genStr = ageEl.getAttribute('data-generated'); // Pl: "2025-12-19 17:30:00"
        if (genStr) {
            const t = genStr.split(/[- :]/);
            // Kényszerítsük a helyi időzónát
            const genDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

            // Ha a genDate nagyobb lenne mint a mostani idő (időzóna hiba), 
            // akkor 0-nak vesszük a különbséget
            let diffSec = Math.floor((now - genDate) / 1000);

            // Ha negatív vagy irreálisan nagy (pl. 18 óra), korrigáljuk
            if (diffSec < 0 || diffSec > 86400) diffSec = 0;

            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;

            const timeStr = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            ageEl.textContent = `Jelentés: ${timeStr} perce frissült`;
        }
    }
}