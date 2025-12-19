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
        } catch (e) { }

        if (geckoPath) {
            builder.setFirefoxService(new firefox.ServiceBuilder(geckoPath));
        }

        let driver = await builder.build();
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

        // Dátumok: ISO a gépnek, magyar az embernek
        const isoTime = now.toISOString();
        const huTime = now.toLocaleString("hu-HU", { timeZone: "Europe/Budapest" });

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

                results.push({
                    id: entry.id,
                    label: entry.label,
                    free,
                    total: Number(entry.maxLot),
                    updated,
                    url: entry.url.startsWith('http') ? entry.url : `https://www.budapestkozut.hu${entry.url}`
                });
            } catch (err) { console.error(`❌ Hiba (${entry.id}):`, err.message); }
        }

        // 1. JSON mentése
        fs.writeFileSync(outPath, JSON.stringify({ generatedAt: isoTime, parkings: results }, null, 2));

        // 2. HTML GENERÁLÁS
        const templatePath = path.join(__dirname, 'index.template.html');
        const targetHtmlPath = path.join(__dirname, 'index.html');

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const cardsHtml = results.map(p => {
                const percent = Math.round((p.free / p.total) * 100);
                const statusClass = percent < 10 ? 'status-low' : (percent < 25 ? 'status-warn' : 'status-ok');

                return `
      <section class="parking-item ${statusClass}">
        <div class="info">
          <h2>${p.label}</h2>
          <div class="capacity">
            <span class="free">${p.free}</span>
            <span class="total">/ ${p.total}</span>
          </div>
        </div>
        <div class="progress-container">
          <div class="progress-bar" style="width: ${percent}%"></div>
        </div>
        <div class="visual">
          <div class="percentage">${percent}% szabad</div>
          <div class="update-info">Frissítve: ${huTime}</div>
        </div>
      </section>`;
            }).join('\n');

        // 1. A kártyák beillesztése (a sablon üres listáját keressük)
        html = html.replace('<main id="list">', `<main id="list">${cardsHtml}`);

        // 2. Az időbélyeg frissítése (Reguláris kifejezéssel, hogy bármit felülírjon az idézőjelek között)
        html = html.replace(/data-generated=".*?"/, `data-generated="${isoTime}"`);

            fs.writeFileSync(targetHtmlPath, html);
            console.log('✅ index.html frissítve.');
        }

        // 3. Másolás a public mappába
        ['index.html', 'style.css', 'script.js'].forEach(file => {
            const src = path.join(__dirname, file);
            const dest = path.join(outDir, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, dest);
        });

        console.log('✨ Build kész!');

    } catch (globalErr) {
        console.error('💥 KRITIKUS HIBA:', globalErr.message);
    } finally {
        if (driver) {
            await driver.quit();
            console.log('--- Driver leállítva ---');
        }
    }
})();