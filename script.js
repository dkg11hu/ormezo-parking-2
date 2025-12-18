function updateClocks() {
    const now = new Date();
    
    // 1. Rendszeridő (Világosszürke)
    const sysEl = document.getElementById('system-time');
    if (sysEl) {
        sysEl.textContent = `Rendszeridő: ${now.toLocaleTimeString('hu-HU')}`;
    }

    // 2. Jelentés kora (Piros)
    const ageEl = document.getElementById('data-age');
    if (ageEl) {
        const genStr = ageEl.getAttribute('data-generated');
        if (genStr) {
            // Manuális darabolás a Safari kedvéért: "2025-12-18 19:38:56"
            const t = genStr.split(/[- :]/);
            // JS Date hónapok 0-tól indulnak, ezért t[1]-1
            const genDate = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
            
            const diffSec = Math.max(0, Math.floor((now - genDate) / 1000));
            const h = Math.floor(diffSec / 3600);
            const m = Math.floor((diffSec % 3600) / 60);
            const s = diffSec % 60;

            const timeStr = [h, m, s].map(v => v.toString().padStart(2, '0')).join(':');
            ageEl.textContent = `Jelentés: ${timeStr} idővel ezelőttről`;
        }
    }
}

setInterval(updateClocks, 1000);
updateClocks();

document.getElementById('refreshBtn')?.addEventListener('click', function() {
    this.textContent = "Töltés...";
    location.reload();
});