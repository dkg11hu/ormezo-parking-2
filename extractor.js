const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    if (!fs.existsSync(urlsPath)) return console.error("❌ urls.json hiányzik!");
    const facilities = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

    // Chrome opciók a stabilitásért és a hibák elkerüléséért
    let options = new chrome.Options();
    options.addArguments('--headless'); // Simább headless mód az 'unknown command' ellen
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--remote-allow-origins=*');

    let driver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        let results = [];
        let sourceUpdateTimes = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        for (const entry of facilities) {
            console.log(`⏳ Scrape: ${entry.label}...`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 15000);
                const rawText = await el.getText();

                if (entry.timestampSelector) {
                    try {
                        const tsSelector = entry.timestampSelector.css ? By.css(entry.timestampSelector.css) : By.xpath(entry.timestampSelector.xpath);
                        const tsEl = await driver.findElement(tsSelector);
                        sourceUpdateTimes.push(await tsEl.getText());
                    } catch (e) { }
                }

                const match = rawText.match(/(\d+)/);
                results.push({ ...entry, free: match ? match[1] : "N/A" });
            } catch (err) {
                results.push({ ...entry, free: "N/A" });
            }
        }

        const displaySourceTime = sourceUpdateTimes.length > 0 ? sourceUpdateTimes[0] : huTime;

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const allCardsHtml = results.map(res => {
                const freeNum = res.free === "N/A" ? 0 : parseInt(res.free);
                const max = parseInt(res.maxLot) || 1;
                const percent = Math.min(Math.round((freeNum / max) * 100), 100);
                let status = percent <= 15 ? 'status-low' : (percent <= 50 ? 'status-warn' : 'status-ok');

                // A kártya struktúra megtartja a flexible shrinkage-et támogató osztályokat
                return `
                <a href="${res.url}" target="_blank" class="card-link">
                    <div class="card ${status}" style="--ratio: ${percent}%">
                        <div class="card-content-row">
                            <h2>${res.label}</h2>
                            <div class="value-container">
                                <span class="value">${res.free}</span>
                                <span class="max-lot">/ ${max}</span>
                            </div>
                        </div>
                    </div>
                </a>`;
            }).join('\n');

            html = html.replace(/(id="dashboard-grid"[^>]*>)([\s\S]*?)(<\/div>)/, `$1${allCardsHtml}$3`);
            html = html.replace(/id="last-update"[^>]*>.*?<\/span>/, `id="last-update" class="info-value">${displaySourceTime}</span>`);
            html = html.replace(/id="system-time"[^>]*>.*?<\/span>/, `id="system-time" class="info-value system-time-color">${huTime}</span>`);

            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, 'index.html'), html);

            // Fájlok másolása a public mappába (2025-12-17-i utasítás szerint)
            ['style.css', 'script.js', 'favicon.svg'].forEach(file => {
                if (fs.existsSync(file)) fs.copyFileSync(file, path.join(publicDir, file));
            });

            console.log(`✅ Kész: ${huTime}`);
        }
    } finally {
        if (driver) await driver.quit();
    }
}
runExtractor();