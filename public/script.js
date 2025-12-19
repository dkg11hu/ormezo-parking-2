function updateClocks() {
    const now = new Date();

    // 1. Rendszeridő
    const sysEl = document.getElementById('system-time');
    if (sysEl) {
        sysEl.textContent = now.toLocaleTimeString('hu-HU');
    }

    // 2. Jelentés kora - Stabilizált verzió
    const ageEl = document.getElementById('data-age');
    if (ageEl) {
        const genStr = ageEl.getAttribute('data-generated');
        if (genStr && genStr !== "---") {
            const t = genStr.split(/[- :]/);
            const genDate = new Date(t[0], t[1] - 1, t[2], t[3], t[4], t[5]);

            let diffSec = Math.floor((now - genDate) / 1000);
            if (diffSec < 0) diffSec = 0;

            const m = Math.floor(diffSec / 60);
            const s = diffSec % 60;

            ageEl.textContent = `Kora: ${m}p ${s}mp`;
        } else {
            ageEl.textContent = "Kora: --";
        }
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