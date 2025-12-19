const fs = require('fs');
const path = require('path');

const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');

const facilities = require(path.resolve(__dirname, 'urls.json'));
const outDir = path.resolve(__dirname, 'public');
const outPath = path.join(outDir, 'parking-status.json');

async function startDriver() {
    let options = new firefox.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');

    console.log('--- Driver konfigurálása ---');
    try {
        let builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);
        let geckoPath = '';
        try {
            geckoPath = require('child_process').execSync('which geckodriver').toString().trim();
            console.log(`--- Geckodriver megtalálva: ${geckoPath} ---`);
        } catch (e) {
            console.warn('--- Geckodriver automata mód ---');
        }

        if (geckoPath) {
            builder.setFirefoxService(new firefox.ServiceBuilder(geckoPath));
        }

        let driver = await builder.build();
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
        if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

        driver = await startDriver();
        const results = [];
        const now = new Date();
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
                        diffMinutes = Math.round((now.getTime() - updateTime.getTime()) / 1000 / 60);
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

        // 1. JSON mentése
        const outputData = { generatedAt: budapestTimeStr, parkings: results };
        fs.writeFileSync(outPath, JSON.stringify(outputData, null, 2));
        console.log(`✅ JSON kimentve: ${outPath}`);

        // 2. HTML GENERÁLÁS SABLONBÓL (ADATOK BEÉGETÉSE)
        const templatePath = path.join(__dirname, 'index.template.html');
        const targetHtmlPath = path.join(__dirname, 'index.html');

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            // KÁRTYÁK GENERÁLÁSA
            const cardsHtml = results.map(p => {
                const percent = Math.round((p.free / p.total) * 100);
                return `
      <section class="parking-item">
        <div class="info">
          <h2>${p.label}</h2>
          <div class="capacity">
            <span class="free">${p.free}</span>
            <span class="total">/ ${p.total}</span>
          </div>
        </div>
        <div class="visual">
          <div class="percentage">${percent}%</div>
          <div class="update-info">Frissítve: ${p.minutesAgo !== null ? p.minutesAgo + ' perce' : p.updated}</div>
        </div>
      </section>`;
            }).join('\n');

            // BEHELYETTESÍTÉS (Csak egyszer, az if-en belül!)
            html = html.replace('<main id="list">', `<main id="list">${cardsHtml}`);
            html = html.replace('data-generated=""', `data-generated="${budapestTimeStr}"`);

            fs.writeFileSync(targetHtmlPath, html);
            console.log('✅ index.html sikeresen frissítve az aktuális adatokkal.');
        } else {
            console.warn('⚠️ index.template.html nem található!');
        }

        // 3. UI Fájlok másolása a public mappába
        const uiFiles = ['index.html', 'style.css', 'script.js'];
        uiFiles.forEach(file => {
            const src = path.join(__dirname, file);
            const dest = path.join(outDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
                console.log(`➡️  Másolva: ${file} -> public/`);
            }
        });

        console.log('✨ Build kész!');

    } catch (globalErr) {
        console.error('💥 KRITIKUS HIBA:', globalErr.message);
        process.exit(1);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('--- Driver leállítva ---');
        }
    }
})();