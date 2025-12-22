function updateDashboard() {
    const now = Date.now(); // Ezredmásodperc pontosságú jelenlegi idő

    // 1. ÓRA (Rendszeridő)
    const clockEl = document.getElementById('system-time');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    // 2. ADAT-KOR SZÁMÍTÁSA
    const ageEl = document.getElementById('last-update');
    if (ageEl) {
        // Kiolvassuk a hosszú számot a HTML-ből
        const genTimestamp = parseInt(ageEl.getAttribute('data-generated'));

        if (!isNaN(genTimestamp)) {
            // Kiszámoljuk a különbséget másodpercben
            let diffSec = Math.floor((now - genTimestamp) / 1000);

            // Ha negatív lenne (mert a GitHub szervere pár másodperccel előrébb jár), állítsuk 0-ra
            if (diffSec < 0) diffSec = 0;

            // Ha a különbség több mint 2 óra (7200 mp), akkor valószínűleg időzóna hiba van, 
            // de ezzel a tiszta timestamp módszerrel ez most már ki lesz küszöbölve.

            if (diffSec < 60) {
                ageEl.textContent = `Adatok: ${diffSec} mp-e frissültek`;
            } else {
                const mins = Math.floor(diffSec / 60);
                const secs = diffSec % 60;
                ageEl.textContent = `Adatok: ${mins}p ${secs}mp-e frissültek`;
            }

            // Színkód: 20 perc után piros (hiba jelzése)
            ageEl.style.color = (diffSec > 1200) ? "#ff4444" : "#00f2ff";
        }
    }
}

// Folyamatos frissítés 1 másodpercenként
setInterval(updateDashboard, 1000);

// Azonnali indítás betöltéskor
document.addEventListener('DOMContentLoaded', updateDashboard);
updateDashboard();