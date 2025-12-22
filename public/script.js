/**
 * Real-time óra frissítése (Narancssárga kijelző)
 */
function updateClock() {
    const timeElement = document.getElementById('system-time');
    if (!timeElement) return;

    const now = new Date();
    timeElement.textContent = now.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
}

/**
 * Adatok frissességi idejének számítása és stílusozása
 */
function updateDataAge() {
    // Az extractor.js a 'last-update' elembe teszi a data-generated attribútumot
    const ageEl = document.getElementById('last-update');
    if (!ageEl) return;

    const genTimeStr = ageEl.getAttribute('data-generated');
    if (!genTimeStr) return;

    const genTime = new Date(genTimeStr);
    const now = new Date();
    const diffSec = Math.floor((now - genTime) / 1000);

    if (isNaN(diffSec)) return;

    // Kijelzés formázása
    if (diffSec < 60) {
        ageEl.textContent = `Updated: ${diffSec} sec ago`;
    } else {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        ageEl.textContent = `Updated: ${mins} min ${secs} sec ago`;
    }

    // Dinamikus színezés: 15 perc (900 mp) után figyelmeztető piros
    if (diffSec >= 900) {
        ageEl.style.color = "#ff4444";
        ageEl.style.textShadow = "0 0 10px rgba(255, 68, 68, 0.6)";
    } else {
        ageEl.style.color = "#00d4ff"; // Eredeti cián
        ageEl.style.textShadow = "0 0 8px rgba(0, 212, 255, 0.4)";
    }
}

/**
 * Inicializálás és egyetlen közös ciklus az erőforrás-takarékosságért
 */
document.addEventListener('DOMContentLoaded', () => {
    // Azonnali futtatás
    updateClock();
    updateDataAge();

    // Közös intervallum 1 másodperces frissítéssel
    setInterval(() => {
        updateClock();
        updateDataAge();
    }, 1000);
});