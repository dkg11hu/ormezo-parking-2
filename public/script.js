async function refreshParkingStatus() {
    // Rendszeridő frissítése (mindig lefut)
    const systemTimeEl = document.getElementById('system-time');
    if (systemTimeEl) {
        systemTimeEl.textContent = new Date().toLocaleTimeString('hu-HU', {
            hour: '2-digit', minute: '2-digit'
        });
    }

    try {
        // JAVÍTÁS: Nem 'public/parking-status.json', mert már a public-ban vagyunk!
        const response = await fetch(`parking-status.json?ts=${Date.now()}`);

        if (!response.ok) throw new Error('status JSON not found');

        const data = await response.json();

        // Csak létező elemeket frissítünk (a cím alatti dátumot)
        const reportDateEl = document.getElementById('report-date');
        if (reportDateEl && data.generatedAt) {
            reportDateEl.textContent = `Frissítve: ${data.generatedAt}`;
        }

    } catch (error) {
        console.error('Hiba a JSON betöltésekor:', error);
    }
}

// Oldal újratöltése a frissítés gombra
const refreshBtn = document.getElementById('refreshBtn');
if (refreshBtn) {
    refreshBtn.addEventListener('click', () => location.reload());
}

// Futtatás
refreshParkingStatus();
setInterval(refreshParkingStatus, 60000);