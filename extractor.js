const fs = require('fs');
const path = require('path');

const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
// A JSON fájlt közvetlenül a public mappába irányítjuk
const outPath = path.join(outDir, 'parking-status.json');

async function startDriver() {
    let options = new firefox.Options();
    options.addArguments('--headless', '--no-sandbox', '--disable-dev-shm-usage');

    console.log('--- Driver konfigurálása ---');
    try {
        let driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();
        console.log('--- Driver sikeresen elindult ---');
        return driver;
    } catch (e) {
        console.error('--- Driver indítási hiba ---');
        throw e;
    }
}

(async function main() {
    let driver;
    try {
        console.log('🚀 EXTRACTOR START');

        // Biztosítjuk, hogy a public mappa létezik
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        driver = await startDriver();
        const results = [];

        const now = new Date();
        // Safari-barát ISO formátum: "2025-12-19 18:30:00"
        const budapestTimeStr = now.toLocaleString("sv-SE", { timeZone: "Europe/Budapest" }).replace('T', ' ');

        for (const entry of facilities) {
            console.log(`- Processing: ${entry.label}`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector?.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 10000);
                const raw = await el.getText();
                const free = parseInt(raw.match(/(\d+)/)[1], 10);

                let updated = '';
                try {
                    const tsEl = await driver.wait(until.elementLocated(By.xpath(entry.timestampSelector.xpath)), 4000);
                    updated = await tsEl.getText();
                } catch (e) { updated = 'N/A'; }

                let diffMinutes = null;
                if (updated && updated !== 'N/A') {
                    const isoReady = updated.replace(/\./g, '-').replace(' ', 'T');
                    const updateTime = new Date(isoReady + "+01:00");

                    if (!isNaN(updateTime)) {
                        const diffMs = now.getTime() - updateTime.getTime();
                        diffMinutes = Math.round(diffMs / 1000 / 60);
                    }
                }

                results.push({
                    id: entry.id,
                    label: entry.label,
                    free,
                    total: Number(entry.maxLot),
                    updated,
                    minutesAgo: diffMinutes,
                    url: entry.url.startsWith('http') ? entry.url : `https://www.budapestkozut.hu${entry.url}`
                });
            } catch (err) { console.error(`❌ Hiba (${entry.id}):`, err.message); }
        }

        const outputData = {
            generatedAt: budapestTimeStr,
            parkings: results
        };

        // 1. JSON mentése a public mappába
        fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));
        console.log(`✅ Adatok kimentve: ${outPath}`);

        // 2. UI Fájlok másolása (index.html, style.css, script.js) -> public/
        const uiFiles = ['index.html', 'style.css', 'script.js'];
        uiFiles.forEach(file => {
            const src = path.join(__dirname, file);
            const dest = path.join(outDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`➡️  Másolva: ${file} -> public/`);
            } else {
                console.warn(`⚠️  Hiányzó UI fájl: ${file}`);
            }
        });

        console.log('✨ Minden fájl készen áll a deploy-ra a public mappában.');

    } catch (globalErr) {
        console.error('💥 KRITIKUS HIBA:', globalErr.message);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('--- Driver leállítva ---');
        }
    }
})();