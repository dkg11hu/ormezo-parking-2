const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    const targetHtmlPath = path.join(publicDir, 'index.html');
    const targetStylePath = path.join(publicDir, 'style.css');
    const targetScriptPath = path.join(publicDir, 'script.js');

    const srcStylePath = path.join(__dirname, 'style.css');
    const srcScriptPath = path.join(__dirname, 'script.js');

    if (!fs.existsSync(urlsPath)) {
        console.error("❌ urls.json hiányzik!");
        return;
    }
    const facilities = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

    let options = new firefox.Options();
    options.addArguments('--headless');

    let driver;
    try {
        driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();

        let results = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const timestamp = now.getTime();

        for (const entry of facilities) {
            console.log(`⏳ Scrape: ${entry.label}...`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 15000);
                const rawText = await el.getText();

                // Hibatűrő szám kinyerés
                const match = rawText.match(/(\d+)/);
                const freeSpots = match ? parseInt(match[1], 10) : "N/A";

                results.push({
                    id: entry.id,
                    label: entry.label,
                    url: entry.url,
                    maxLot: entry.maxLot,
                    free: freeSpots
                });
            } catch (err) {
                console.error(`⚠️ Hiba (${entry.id}): ${err.message}`);
                results.push({
                    id: entry.id,
                    label: entry.label,
                    url: entry.url,
                    maxLot: entry.maxLot,
                    free: "N/A"
                });
            }
        }

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            function generateCardHtml(res) {
                const free = res.free === "N/A" ? 0 : parseInt(res.free);
                const max = parseInt(res.maxLot) || 1;
                // Százalék kiszámítása a progress barhoz
                const percent = Math.min(Math.round((free / max) * 100), 100);

                // Státusz osztály meghatározása
                let statusClass = 'status-ok';
                if (percent <= 15) statusClass = 'status-low';
                else if (percent <= 50) statusClass = 'status-warn';

                return `
                <div class="card ${statusClass}" style="--ratio: ${percent}%">
                    <div class="card-content-row">
                        <h2>${res.label}</h2>
                        <div class="value-container">
                            <span class="value">${res.free === "N/A" ? "N/A" : free}</span>
                            <span class="max-lot">/ ${max}</span>
                        </div>
                    </div>
                </div>`;
            }

            // Összes kártya összefűzése
            const allCardsHtml = results.map(generateCardHtml).join('\n');

            // Beillesztés a közös konténerbe
            html = html.replace(/(id="dashboard-grid"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${allCardsHtml}\n$3`);

            // Időbélyegek frissítése (Figyeljünk a span/id egyezőségre a template-ben)
            html = html.replace(/id="system-time"[^>]*>.*?<\/span>/, `id="system-time" class="info-value system-time-color">${huTime}</span>`);
            html = html.replace(/data-generated="[^"]*"/, `data-generated="${timestamp}"`);

            // Könyvtár és fájl műveletek
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(targetHtmlPath, html);

            // Statikus fájlok másolása (szabályod szerint a public-ba)
            if (fs.existsSync(srcStylePath)) fs.copyFileSync(srcStylePath, targetStylePath);
            if (fs.existsSync(srcScriptPath)) fs.copyFileSync(srcScriptPath, targetScriptPath);
            if (fs.existsSync('favicon.svg')) fs.copyFileSync('favicon.svg', path.join(publicDir, 'favicon.svg'));

            console.log(`✅ Sikeres frissítés: ${huTime}`);
        }
    } catch (criticalErr) {
        console.error("❌ Kritikus hiba a futás során:", criticalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
}

runExtractor();