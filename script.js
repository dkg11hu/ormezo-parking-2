function updateDashboard() {
    const now = new Date();

    // 1. ÓRA
    const clockEl = document.getElementById('system-time');
    if (clockEl) {
        clockEl.textContent = now.toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }

    // 2. ADAT-KOR
    const ageEl = document.getElementById('last-update');
    if (ageEl) {
        const genTimeStr = ageEl.getAttribute('data-generated');
        if (genTimeStr) {
            const genTime = new Date(genTimeStr);
            // .getTime() használatával kiküszöböljük az időzóna hibákat
            let diffSec = Math.floor((now.getTime() - genTime.getTime()) / 1000);

            // Ha negatív lenne (időzóna elcsúszás miatt), állítsuk 0-ra
            if (diffSec < 0) diffSec = 0;

            if (!isNaN(diffSec)) {
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
}

setInterval(updateDashboard, 1000);
document.addEventListener('DOMContentLoaded', updateDashboard);
updateDashboard();