function updateDashboard() {
    const now = new Date();

    // 1. ÓRA FRISSÍTÉSE
    const clockEl = document.getElementById('system-time');
    if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    }

    // 2. ADAT-KOR FRISSÍTÉSE
    const ageEl = document.getElementById('last-update'); // A HTML-edben ez az ID!
    if (ageEl) {
        const genTimeStr = ageEl.getAttribute('data-generated');
        
        if (!genTimeStr || genTimeStr === "") {
            ageEl.textContent = "Adatok: Frissítésre vár...";
            return;
        }

        const genTime = new Date(genTimeStr);
        const diffSec = Math.floor((now - genTime) / 1000);

        if (!isNaN(diffSec)) {
            // Itt számoljuk ki és írjuk ki a magyar szöveget, BELÜL a függvényben
            if (diffSec < 60) {
                ageEl.textContent = `Adatok: ${diffSec} mp-e frissültek`;
            } else {
                const mins = Math.floor(diffSec / 60);
                const secs = diffSec % 60;
                ageEl.textContent = `Adatok: ${mins}p ${secs}mp-e frissültek`;
            }
            
            // Színkód: 20 perc után piros
            ageEl.style.color = (diffSec > 1200) ? "#ff4444" : "#00f2ff";
        }
    }
}

// EGYETLEN időzítő, ami mindent kezel másodpercenként
setInterval(updateDashboard, 1000);

// Indítás betöltéskor
document.addEventListener('DOMContentLoaded', updateDashboard);
updateDashboard();