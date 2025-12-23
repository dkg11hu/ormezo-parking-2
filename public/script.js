function updateLastUpdateTime() {
    const lastUpdateEl = document.getElementById('last-update');
    if (!lastUpdateEl) return;

    const generatedAt = parseInt(lastUpdateEl.getAttribute('data-generated'));
    if (!generatedAt) return;

    const now = Date.now();
    const diffInSeconds = Math.floor((now - generatedAt) / 1000);

    let timeString = "";
    if (diffInSeconds < 60) {
        timeString = `${diffInSeconds} mp-e frissült`;
    } else {
        const mins = Math.floor(diffInSeconds / 60);
        const secs = diffInSeconds % 60;
        timeString = `${mins} p ${secs} mp-e frissült`;
    }

    lastUpdateEl.textContent = `Adatok: ${timeString}`;
}

// Rendszeróra frissítése a fejlécben
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

// Frissítés indítása
setInterval(updateLastUpdateTime, 1000);
setInterval(updateSystemTime, 1000);
updateLastUpdateTime();
updateSystemTime();