const fs = require('fs');
const path = require('path');

const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
const outPath = path.join(__dirname, 'parking-status.json');

async function startDriver() {
    const GECKO_PATH = '/usr/local/bin/geckodriver';
    let options = new firefox.Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');
    let builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);
    if (fs.existsSync(GECKO_PATH)) builder.setFirefoxService(new firefox.ServiceBuilder(GECKO_PATH));
    return await builder.build();
}

(async function main() {
    let driver;
    try {
        console.log('🚀 EXTRACTOR START');
        driver = await startDriver();
        const results = [];

        // BUDAPESTI IDŐ FIXÁLÁSA
        const now = new Date();
        const budapestTimeStr = now.toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });
        // Ezt használjuk a matematikai különbséghez:
        const budapestNow = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Budapest" }));

        for (const entry of facilities) {
            console.log(`- Processing: ${entry.label}`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector?.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 8000);
                const raw = await el.getText();
                const free = parseInt(raw.match(/(\d+)/)[1], 10);

                let updated = '';
                try {
                    const tsEl = await driver.wait(until.elementLocated(By.xpath(entry.timestampSelector.xpath)), 4000);
                    updated = await tsEl.getText();
                } catch (e) { updated = 'N/A'; }

                let diffMinutes = null;
                if (updated && updated !== 'N/A') {
                    // Dátum formátum tisztítása (2025.12.18 -> 2025/12/18)
                    const updateTime = new Date(updated.replace(/[.\-]/g, '/'));
                    if (!isNaN(updateTime)) {
                        const diffMs = budapestNow - updateTime;
                        // Az abszolút érték segít, ha pár másodperc eltérés van a szerverek között
                        diffMinutes = Math.round(Math.abs(diffMs) / 1000 / 60);
                    }
                }

                results.push({
                    id: entry.id, label: entry.label, free, total: Number(entry.maxLot),
                    updated, minutesAgo: diffMinutes,
                    url: entry.url.startsWith('http') ? entry.url : `https://www.budapestkozut.hu${entry.url}`
                });
            } catch (err) { console.error(`❌ Hiba (${entry.id}):`, err.message); }
        }

        const outputData = {
            generatedAt: budapestTimeStr,
            parkings: results
        };

        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));
        console.log(`✅ Adatok kimentve (Budapesti idő: ${budapestTimeStr})`);
    } finally { if (driver) await driver.quit(); }
})();