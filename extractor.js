const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    if (!fs.existsSync(urlsPath)) return console.error("❌ urls.json hiányzik!");
    const facilities = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

    let options = new firefox.Options();
    options.addArguments('--headless');

    let driver;
    try {
        driver = await new Builder().forBrowser('firefox').setFirefoxOptions(options).build();
        let results = [];
        let sourceUpdateTimes = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        for (const entry of facilities) {
            console.log(`⏳ Scrape: ${entry.label}...`);
            try {
                await driver.get(entry.url);
                const el = await driver.wait(until.elementLocated(entry.selector.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath)), 15000);
                const rawText = await el.getText();

                if (entry.timestampSelector) {
                    try {
                        const tsEl = await driver.findElement(entry.timestampSelector.css ? By.css(entry.timestampSelector.css) : By.xpath(entry.timestampSelector.xpath));
                        sourceUpdateTimes.push(await tsEl.getText());
                    } catch (e) { }
                }

                results.push({ ...entry, free: (rawText.match(/(\d+)/) || ["0", "N/A"])[1] });
            } catch (err) {
                results.push({ ...entry, free: "N/A" });
            }
        }

        const displaySourceTime = sourceUpdateTimes[0] || huTime;

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const allCardsHtml = results.map(res => {
                const free = res.free === "N/A" ? 0 : parseInt(res.free);
                const max = parseInt(res.maxLot) || 1;
                const percent = Math.min(Math.round((free / max) * 100), 100);
                let status = percent <= 15 ? 'status-low' : (percent <= 50 ? 'status-warn' : 'status-ok');

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

            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir);
            fs.writeFileSync(path.join(publicDir, 'index.html'), html);
            fs.copyFileSync('style.css', path.join(publicDir, 'style.css'));
            fs.copyFileSync('script.js', path.join(publicDir, 'script.js'));
            console.log(`✅ Kész: ${huTime}`);
        }
    } finally { if (driver) await driver.quit(); }
}
runExtractor();