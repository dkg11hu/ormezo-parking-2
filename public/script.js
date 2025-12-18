function updateSystemTime() {
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        systemTimeEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Oldal automatikus újratöltése 5 percenként
function setupAutoRefresh(minutes = 5) {
    setInterval(() => {
        // Csak akkor frissít, ha a lap látható (kíméli az akkut)
        if (!document.hidden) {
            location.reload();
        }
    }, minutes * 60 * 1000);
}

// Manuális frissítés gomb
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        refreshBtn.style.opacity = "0.5";
        refreshBtn.textContent = "Frissítés...";
        location.reload();
    });
}

// Indítás
updateSystemTime();
setInterval(updateSystemTime, 30000); // Félpercenkénti óra frissítés
setupAutoRefresh(5);