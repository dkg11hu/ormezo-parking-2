function updateUI() {
    // 1. Rendszeridő frissítése (hogy lásd, él az oldal)
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        systemTimeEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Oldal újratöltése a frissítés gombra
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        refreshBtn.textContent = "Frissítés...";
        location.reload();
    });
}

// Automatikus frissítés 5 percenként
// Mivel a Builder már beleégette az adatokat az index.html-be, 
// a reload fogja lehúzni a GitHub Actions által generált legfrissebb változatot.
function setupAutoRefresh(minutes = 5) {
    setInterval(() => {
        if (!document.hidden) {
            location.reload();
        }
    }, minutes * 60 * 1000);
}

// Indítás
updateUI();
setInterval(updateUI, 30000); // Félpercenkénti órafrissítés
setupAutoRefresh(5);