const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
// ... többi import ...

async function runExtractor() {
    // ... utak beállítása ...

    let options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--remote-allow-origins=*');

    // GitHub Actions környezetben fixáljuk az utat, hogy ne omoljon össze a kereső
    if (process.env.GITHUB_ACTIONS) {
        options.setBinaryPath('/usr/bin/google-chrome');
    }

    let driver;
    try {
        console.log("🚀 Selenium indítása (Manual Driver Mode)...");

        const service = new chrome.ServiceBuilder('/usr/bin/chromedriver'); // Fix driver út

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(service) // Kényszerített szerviz használat
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

                const match = rawText.match(/(\d+)/);
                results.push({ ...entry, free: match ? match[1] : "N/A" });
            } catch (err) {
                console.error(`⚠️ Hiba (${entry.label}): ${err.message}`);
                results.push({ ...entry, free: "N/A" });
            }
        }

        // HTML generálás (megtartva a flexible shrinkage-et)
        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');
            const allCardsHtml = results.map(res => {
                const freeNum = res.free === "N/A" ? 0 : parseInt(res.free);
                const max = parseInt(res.maxLot) || 1;
                const percent = Math.min(Math.round((freeNum / max) * 100), 100);
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
            html = html.replace(/id="last-update"[^>]*>.*?<\/span>/, `id="last-update" class="info-value">${huTime}</span>`);
            html = html.replace(/id="system-time"[^>]*>.*?<\/span>/, `id="system-time" class="info-value system-time-color">${huTime}</span>`);

            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(path.join(publicDir, 'index.html'), html);

            ['style.css', 'script.js', 'favicon.svg'].forEach(file => {
                if (fs.existsSync(file)) fs.copyFileSync(file, path.join(publicDir, file));
            });
            console.log(`✅ Sikeres generálás: ${huTime}`);
        }
    } catch (criticalErr) {
        console.error("❌ Kritikus hiba a Selenium indításakor:", criticalErr.message);
        process.exit(1);
    } finally {
        if (driver) await driver.quit();
    }
}
runExtractor();