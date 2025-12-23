function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update');
    if (!lastUpdateEl) return;

    // A HTML-ben az id="last-update" csak a neon értékre mutasson!
    const generatedAt = parseInt(lastUpdateEl.getAttribute('data-generated'));
    if (!generatedAt) return;

    const now = Date.now();
    const diffInSeconds = Math.floor((now - generatedAt) / 1000);

    let timeString = "";
    const mins = Math.floor(diffInSeconds / 60);
    const secs = diffInSeconds % 60;

    // Formátum: Xp Ymp (szóközzel a p után)
    if (mins > 0) {
        timeString = `${mins}p ${secs}mp`;
    } else {
        timeString = `${secs}mp`;
    }

    // Csak az értéket frissítjük, a "Adatok:" felirat a HTML-ben marad fehér
    lastUpdateEl.textContent = timeString;
}

function updateSystemTime() {
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        const now = new Date();
        systemTimeEl.textContent = now.toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Indítás
setInterval(updateLastUpdateTime, 1000);
setInterval(updateSystemTime, 1000);
updateLastUpdateTime();
updateSystemTime();