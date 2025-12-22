function updateDashboard() {
    const now = new Date().getTime(); // Jelenlegi idő timestamp-ként

    const clockEl = document.getElementById('system-time');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    const ageEl = document.getElementById('last-update');
    if (ageEl) {
        const genTimestamp = parseInt(ageEl.getAttribute('data-generated'));

        if (!isNaN(genTimestamp)) {
            let diffSec = Math.floor((now - genTimestamp) / 1000);

            // Ha az eltolódás miatt negatív lenne, kezeljük le
            if (diffSec < 0) diffSec = 0;

            if (diffSec < 60) {
                ageEl.textContent = `Adatok: ${diffSec} mp-e frissültek`;
            } else {
                const mins = Math.floor(diffSec / 60);
                const secs = diffSec % 60;
                ageEl.textContent = `Adatok: ${mins}p ${secs}mp-e frissültek`;
            }
            ageEl.style.color = (diffSec > 1200) ? "#ff4444" : "#00f2ff";
        }
    }
}

setInterval(updateDashboard, 1000);
document.addEventListener('DOMContentLoaded', updateDashboard);
updateDashboard();