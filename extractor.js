const fs = require('fs');
const path = require('path');

const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
const outPath = path.join(__dirname, 'parking-status.json');

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
        driver = await startDriver();
        const results = [];

        // Pontos mostani idő UTC-ben
        const now = new Date();
        // Megjelenítéshez használt magyar formátum
        const budapestTimeStr = now.toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });

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
                    // A kapott formátum: "2025.12.18 23:13:25"
                    // Átalakítjuk ISO-szerűre és KÉNYSZERÍTJÜK a magyar időzónát (+01:00)
                    const isoReady = updated.replace(/\./g, '-').replace(' ', 'T');
                    const updateTime = new Date(isoReady + "+01:00");

                    if (!isNaN(updateTime)) {
                        // Abszolút időkülönbség (mindkettő epoch timestamp)
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

        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));
        console.log(`✅ Adatok kimentve: ${outPath}`);

    } catch (globalErr) {
        console.error('💥 KRITIKUS HIBA:', globalErr.message);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('--- Driver leállítva ---');
        }
    }
})();