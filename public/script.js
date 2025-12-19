function updateClock() {
    const clockEl = document.getElementById('system-time');
    if (!clockEl) return;

    const now = new Date();
    // Magyar formátum: 20:15:05
    const timeStr = now.toLocaleTimeString('hu-HU', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    clockEl.textContent = timeStr;
}

// A korábbi adat-kor számláló függvényed mellé add be ezt is:
function updateDataAge() {
    const ageEl = document.getElementById('data-age');
    if (!ageEl || !ageEl.getAttribute('data-generated')) return;

    const genTime = new Date(ageEl.getAttribute('data-generated'));
    const now = new Date();
    const diffSec = Math.floor((now - genTime) / 1000);

    if (isNaN(diffSec)) return;

    if (diffSec < 60) {
        ageEl.textContent = `Adatok: ${diffSec} mp-el ezelőtt`;
    } else {
        const mins = Math.floor(diffSec / 60);
        const secs = diffSec % 60;
        ageEl.textContent = `Adatok: ${mins}p ${secs}mp-el ezelőtt`;
    }
}

// Indítás és folyamatos frissítés
setInterval(() => {
    updateClock();
    updateDataAge();
}, 1000);

updateClock();
updateDataAge();

// 1 másodpercenkénti frissítés
setInterval(updateDataAge, 1000);
// Azonnali indítás
updateDataAge();

setInterval(updateDataAge, 1000);
updateDataAge();
// Magyaros kijelzés
if (diffSec < 60) {
    ageEl.textContent = `Adatok: ${diffSec} másodperce frissültek`;
} else {
    const mins = Math.floor(diffSec / 60);
    const secs = diffSec % 60;
    ageEl.textContent = `Adatok: ${mins} perce, ${secs} mp-e frissültek`;
}

// Másodpercenként frissítjük a kijelzőt
setInterval(updateDataAge, 1000);

// Azonnal is lefuttatjuk a betöltéskor
document.addEventListener('DOMContentLoaded', updateDataAge);