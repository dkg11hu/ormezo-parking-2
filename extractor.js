const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');

const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
const outPath = path.join(outDir, 'parking-status.json');

(async function main() {
    let driver;
    try {
        console.log('🚀 FIREFOX EXTRACTOR START');

        // Kényszerítjük a manuálisan telepített geckodriver útvonalát
        // Ez megkerüli a hibás Selenium Managert
        const service = new firefox.ServiceBuilder('/usr/local/bin/geckodriver');

        let options = new firefox.Options();
        options.addArguments('--headless');

        driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .setFirefoxService(service) // Fix útvonal átadása
            .build();

        const results = [];

        for (const entry of facilities) {
            console.log(`\n=== Processing ${entry.label} ===`);
            try {
                await driver.get(entry.url);

                let raw = '';
                const total = Number(entry.maxLot);
                const strictPattern = new RegExp(`(\\d+)\\s*/\\s*${total}`);

                // Adat kinyerése (CSS vagy XPath)
                try {
                    const el = entry.selector?.css
                        ? await driver.wait(until.elementLocated(By.css(entry.selector.css)), 8000)
                        : await driver.wait(until.elementLocated(By.xpath(entry.selector.xpath)), 8000);
                    raw = await el.getText();
                } catch (e) {
                    console.warn(`[${entry.id}] Szelektor hiba, próbálkozás test-al...`);
                    const body = await driver.findElement(By.css('body')).getText();
                    const match = body.match(strictPattern);
                    if (match) raw = match[0];
                }

                let free = 0;
                if (raw) {
                    const match = raw.match(/(\d+)/);
                    if (match) free = parseInt(match[1], 10);
                }

                // Időbélyeg
                let updated = 'N/A';
                if (entry.timestampSelector?.xpath) {
                    try {
                        const tsEl = await driver.wait(until.elementLocated(By.xpath(entry.timestampSelector.xpath)), 5000);
                        updated = await tsEl.getText();
                    } catch (e) { }
                }

                results.push({
                    id: entry.id,
                    label: entry.label,
                    free,
                    total,
                    updated,
                    url: entry.url
                });

                console.log(`[${entry.id}] RESULT: ${free} / ${total}`);
            } catch (err) {
                console.error(`❌ Hiba (${entry.id}):`, err.message);
            }
        }

        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
        console.log('\n✅ Kész: public/parking-status.json');

    } catch (err) {
        console.error('❌ Extractor hiba:', err);
        process.exitCode = 1;
    } finally {
        if (driver) {
            try {
                await driver.quit();
            } catch (e) {
                console.warn('Hiba a driver leállításakor:', e.message);
            }
        }
    }
})();