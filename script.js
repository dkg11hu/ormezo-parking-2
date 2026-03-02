/**
 * script.js - Final Production Version
 */
function updateDashboard() {
    const now = new Date();

    // 1. Update "Pontos idő" (Live Clock)
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        systemTimeEl.innerText = now.toLocaleTimeString('hu-HU');
    }

    // 2. Update "Adatok" to show TIME DIFFERENCE
    const lastUpdateEl = document.getElementById('last-update');
    if (lastUpdateEl) {
        const buildTimeAttr = lastUpdateEl.getAttribute('data-timestamp');
        const buildTime = parseInt(buildTimeAttr);

        if (buildTime && !isNaN(buildTime)) {
            const diffInSeconds = Math.floor((now.getTime() - buildTime) / 1000);
            const diffInMinutes = Math.floor(diffInSeconds / 60);

            // Logic for the difference text
            if (diffInSeconds < 60) {
                lastUpdateEl.innerText = "épp most";
            } else {
                lastUpdateEl.innerText = `${diffInMinutes} perce`;
            }
        }
    }
}

// Start the loop immediately
document.addEventListener('DOMContentLoaded', () => {
    updateDashboard();
    // 1000ms ensures the 'Pontos idő' clock ticks every second
    setInterval(updateDashboard, 1000);
});