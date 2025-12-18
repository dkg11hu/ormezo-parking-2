function updateSystemTime() {
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        systemTimeEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }
}

// Oldal automatikus újratöltése (pl. 5 percenként)
// Mivel a Builder már "beégette" az adatokat az index.html-be, 
// a reload fogja lehúzni a GitHub Actions által generált legfrissebb változatot.
function setupAutoRefresh(minutes = 5) {
    setInterval(() => {
        // Csak akkor frissít, ha a lap látható (kíméli az akkut)
        if (!document.hidden) {
            location.reload();
        }
    }, minutes * 60 * 1000);
}

// Manuális frissítés gomb kezelése
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
        // Vizuális visszajelzés
        refreshBtn.style.opacity = "0.5";
        refreshBtn.textContent = "Töltés...";
        location.reload();
    });
}

// Indítás
updateSystemTime();
setInterval(updateSystemTime, 30000); // Rendszeridő frissítése félpercenként
setupAutoRefresh(5); // Új build ellenőrzése 5 percenként