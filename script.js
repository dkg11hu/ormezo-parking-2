// FUNCTION: Calculates and formats the time difference (e.g., "4 hours and 55 minutes ago")
function timeDiffString(updated) {
    try {
        // Handle date format variations (e.g., '2025-12-13 15:26:26' -> '2025-12-13T15:26:26')
        let dateString = updated;
        if (updated && !updated.includes("T") && !updated.includes("Z")) {
            dateString = updated.replace(" ", "T");
        }

        const now = new Date();
        const upd = new Date(dateString); 
        
        const diffMs = now - upd;
        const diffMinTotal = Math.floor(diffMs / 60000); // Total difference in minutes

        if (diffMinTotal < 1) return "just now";
        if (diffMinTotal < 60) return diffMinTotal + " minutes ago";
        
        const diffH = Math.floor(diffMinTotal / 60);
        const diffMinRemainder = diffMinTotal % 60; // Remaining minutes

        if (diffH < 24) {
            let output = diffH + (diffH === 1 ? " hour" : " hours");
            if (diffMinRemainder > 0) {
                // Append remaining minutes with 'and'
                output += " and " + diffMinRemainder + (diffMinRemainder === 1 ? " minute" : " minutes");
            }
            return output + " ago";
        }
        
        const diffD = Math.floor(diffH / 24);
        return diffD + (diffD === 1 ? " day" : " days") + " ago";
    } catch {
        return updated;
    }
}

async function refreshParkingStatus() {
    try {
        // 1. Fetch status JSON - NOTE: Uses cache: "no-store" and a timestamp query to force refresh
        const statusRes = await fetch("public/parking-status.json?ts=" + Date.now(), { cache: "no-store" });
        if (!statusRes.ok) throw new Error("status JSON not found or 404 error");
        
        const statusData = await statusRes.json();

        // 2. Fetch URLs (optional)
        // NOTE: This assumes urls.json is committed to the public folder if needed by the app
        let urlsData = [];
        try {
            const urlsRes = await fetch("urls.json?ts=" + Date.now(), { cache: "no-store" });
            if (urlsRes.ok) urlsData = await urlsRes.json();
        } catch {
            console.warn("urls.json not available, links skipped");
        }

        // 3. Robust Data Extraction 
        let items = [];
        let dataContainer = statusData; 

        if (statusData && statusData.items && Array.isArray(statusData.items.items)) {
            items = statusData.items.items;
            dataContainer = statusData.items; 
        } 
        else if (statusData && Array.isArray(statusData.items)) {
            items = statusData.items;
        } 
        else if (statusData && Array.isArray(statusData)) {
            items = statusData;
        }
    
        if (!Array.isArray(items)) {
            console.error("ERROR: Data structure did not provide a valid array. Continuing with empty array.");
            items = []; 
        }

        // 3.5. Sort items by 'free' spaces in DESCENDING order
        items.sort((a, b) => {
            return (b.free || 0) - (a.free || 0);
        });

        // 4. Clear Grid
        const grid = document.getElementById("parking-grid");
        grid.innerHTML = "";
        
        // 5. Update Header Time
        let headerTime = dataContainer.fetched_at || dataContainer.timestamp || statusData.report_time;

        if (items.length > 0) {
            const latestItemTime = items.reduce((max, item) => 
                (item.updated && item.updated > max) ? item.updated : max, items[0].updated);
            
            if (latestItemTime && new Date(latestItemTime.replace(" ", "T")) > new Date((headerTime || "").replace(" ", "T"))) {
                headerTime = latestItemTime;
            }
        }

        if (headerTime) {
            const relative = timeDiffString(headerTime);
            const dateStringForFormat = (headerTime.includes("T") || headerTime.includes("Z")) ? headerTime : headerTime.replace(" ", "T");
            const updDate = new Date(dateStringForFormat); 
            
            document.getElementById("report-time").textContent =
                "Updated: " + updDate.toLocaleString("hu-HU") + " (" + relative + ")";
        } else if (items.length > 0) {
            const updated = items[0].updated;
            const updDate = new Date(updated.replace(" ", "T"));
            const relative = timeDiffString(updated);
            document.getElementById("report-time").textContent =
                "Updated: " + updDate.toLocaleString("hu-HU") + " (" + relative + ") (external source)";
        }
        
        
        // 6. Calculate and Display Overall Status Summary
        if (items.length > 0) {
            let totalFree = 0;
            let totalTotal = 0;

            items.forEach(entry => {
                totalFree += entry.free || 0;
                totalTotal += entry.total || 0;
            });

            // Occupancy percentage (Occupied / Total)
            const overallPercent = (totalTotal && totalTotal > 0) ? 
                Math.round(((totalTotal - totalFree) / totalTotal) * 100) : 0;
            const overallOccupied = totalTotal - totalFree;

            const summaryHTML = `
                <div class="overall-status">
                    <div class="overall-summary">
                        <span class="free">Free: ${totalFree}</span> / 
                        <span class="occupied">Occupied: ${overallOccupied}</span>
                    </div>
                    <div class="overall-meta">Total ${totalTotal} spaces (${overallPercent}% Occupancy)</div>
                    <div class="status-track">
                        <div class="status-fill" style="width:${overallPercent}%"></div>
                    </div>
                </div>
            `;
            grid.insertAdjacentHTML('beforebegin', summaryHTML);
        }


        // 7. Generate Cards
        items.forEach(entry => { 
            // Occupancy percentage calculation (Occupied / Total)
            const percent = (entry.total && entry.total > 0) ? 
                Math.round(((entry.total - entry.free) / entry.total) * 100) : 0; 
            
            const relative = timeDiffString(entry.updated);
            const urlEntry = urlsData.find(u => u.id === entry.id);
            const detailUrl = urlEntry ? urlEntry.url : "#";

            const card = document.createElement("a");
            card.className = "card";
            card.href = detailUrl;
            card.target = "_blank";
            card.innerHTML = `
                        <div class="left">
                            <div class="label">${entry.label}</div>
                            <div class="bar-wrap">
                                <div class="bar">
                                    <div class="fill" style="width:${percent}%"></div>
                                </div>
                                <div class="pct">${percent}%</div>
                            </div>
                        </div>
                        <div class="numbers">
                            <div class="count">${entry.free}</div>
                            <div class="total">/${entry.total}</div>
                            <div class="timestamp">${relative}</div>
                        </div>
                    `;
            grid.appendChild(card);
        });

    } catch (err) { 
        console.error("Error loading JSON:", err);
        if (err.message.includes("JSON")) {
            document.getElementById("report-time").textContent = "Could not load data. (Invalid JSON)";
        } else {
            document.getElementById("report-time").textContent = "Could not load data.";
        }
    }
}

window.onload = () => {
    refreshParkingStatus();
    setInterval(refreshParkingStatus, 60000); // Refresh data every 60 seconds (1 minute)
};