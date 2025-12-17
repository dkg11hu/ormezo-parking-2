const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

// Útvonalak beállítása
const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
const outPath = path.join(outDir, 'parking-status.json');

const runId = Date.now();
console.log('EXTRACTOR START pid=' + process.pid + ' run=' + runId);

(async function main() {
    let driver;
    try {
        // Chrome opciók beállítása a GitHub Actions (szerver) környezethez
        let options = new chrome.Options();
        options.addArguments('--headless=new'); // Kijelző nélküli mód
        options.addArguments('--no-sandbox');
        options.addArguments('--disable-dev-shm-usage');
        options.addArguments('--disable-gpu');
        options.addArguments('--window-size=1920,1080');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        const results = [];

        for (const entry of facilities) {
            console.log(`\n=== Processing ${entry.label} (${entry.id}) ===`);
            console.log(`[${entry.id}] URL: ${entry.url}`);

            try {
                await driver.get(entry.url);

                let raw = '';
                let free = 0;
                const total = Number(entry.maxLot);
                const strictPattern = new RegExp(`^(\\d+)\\s*/\\s*${entry.maxLot}$`);

                // 1. Próbálkozás CSS szelektorral
                if (entry.selector?.css) {
                    try {
                        const elCss = await driver.wait(until.elementLocated(By.css(entry.selector.css)), 8000);
                        raw = await elCss.getText();
                        console.log(`[${entry.id}] Found via CSS: "${raw}"`);
                    } catch (e) {
                        console.warn(`[${entry.id}] CSS selector failed`);
                    }
                }

                // 2. Próbálkozás XPath-al, ha a CSS nem sikerült vagy nem stimmel a minta
                if ((!raw || !strictPattern.test(raw.trim())) && entry.selector?.xpath) {
                    try {
                        const elXpath = await driver.wait(until.elementLocated(By.xpath(entry.selector.xpath)), 8000);
                        raw = await elXpath.getText();
                        console.log(`[${entry.id}] Found via XPath: "${raw}"`);
                    } catch (e) {
                        console.warn(`[${entry.id}] XPath selector failed`);
                    }
                }

                // Adat feldolgozása
                if (raw && strictPattern.test(raw.trim())) {
                    free = parseInt(raw.trim().match(strictPattern)[1], 10);
                } else {
                    console.error(`[${entry.id}] Could not parse occupancy from: "${raw}"`);
                    free = 0;
                }

                // Időbélyeg kinyerése
                let updated = 'N/A';
                if (entry.timestampSelector?.xpath) {
                    try {
                        const tsXpath = await driver.wait(until.elementLocated(By.xpath(entry.timestampSelector.xpath)), 5000);
                        updated = await tsXpath.getText();
                        console.log(`[${entry.id}] Timestamp: "${updated}"`);
                    } catch (e) {
                        console.warn(`[${entry.id}] Timestamp failed`);
                    }
                }

                results.push({
                    id: entry.id,
                    label: entry.label,
                    free,
                    total,
                    updated,
                    url: entry.url
                });

                console.log(`[${entry.id}] RESULT: Free=${free}, Total=${total}`);

            } catch (err) {
                console.error(`[${entry.id}] Error processing facility:`, err.message);
            }
        }

        // Mentés a public mappába
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        fs.writeFileSync(outPath, JSON.stringify(results, null, 2), 'utf8');
        console.log('\n✅ Generated: ' + outPath);

    } catch (err) {
        console.error('❌ Extractor fatal error:', err);
        process.exitCode = 1;
    } finally {
        if (driver) {
            await driver.quit();
        }
        console.log('EXTRACTOR END run=' + runId);
    }
})();