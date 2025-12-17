async function updateDashboard() {
    const refreshBtn = document.getElementById('refreshBtn');
    const refreshIcon = refreshBtn.querySelector('.material-icons');
    refreshIcon.classList.add('spin');

    try {
        // A builder.js által létrehozott aktuális JSON fájl lekérése
        const response = await fetch('parking-status.json');
        const data = await response.json();

        const listContainer = document.getElementById('list');
        listContainer.innerHTML = '';

        let totalMax = 0;
        let totalFree = 0;
        let latestUpdate = "";

        data.forEach(p => {
            const occupied = p.total - p.free;
            const percent = Math.round((occupied / p.total) * 100);
            const colorClass = percent > 90 ? 'bg-high' : (percent > 70 ? 'bg-med' : 'bg-low');

            totalMax += p.total;
            totalFree += p.free;
            latestUpdate = p.updated;

            listContainer.innerHTML += `
        <div class="parking-card">
          <div style="display:flex; justify-content:space-between; align-items:center">
            <div style="font-weight:500">${p.label}</div>
            <div style="text-align:right">
              <span style="color:var(--green); font-weight:bold">${p.free}</span>
              <span style="font-size:0.7rem; color:var(--text-muted)"> SZABAD</span>
            </div>
          </div>
          <div class="status-track">
            <div class="status-fill ${colorClass}" style="width: ${percent}%"></div>
          </div>
          <div style="font-size:0.7rem; margin-top:8px; color:var(--text-muted)">
            Kapacitás: ${p.total} | Telítettség: ${percent}%
          </div>
        </div>
      `;
        });

        // Összesített adatok számítása
        const totalPercent = Math.round(((totalMax - totalFree) / totalMax) * 100);
        document.getElementById('overall-percent').textContent = `${totalPercent}%`;
        document.getElementById('status-fill').style.width = `${totalPercent}%`;
        document.getElementById('status-fill').className = `status-fill ${totalPercent > 85 ? 'bg-high' : 'bg-low'}`;
        document.getElementById('overall-note').textContent = `${totalFree} szabad hely összesen (${totalMax} férőhelyből).`;
        document.getElementById('last-updated').textContent = `Frissítve: ${latestUpdate}`;

    } catch (error) {
        console.error("Hiba az adatok frissítésekor:", error);
    } finally {
        setTimeout(() => refreshIcon.classList.remove('spin'), 600);
    }
}

document.getElementById('refreshBtn').addEventListener('click', updateDashboard);
window.addEventListener('DOMContentLoaded', updateDashboard);