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

    try {
        let builder = new Builder().forBrowser('firefox').setFirefoxOptions(options);
        let geckoPath = '';
        try {
            geckoPath = require('child_process').execSync('which geckodriver').toString().trim();
        } catch (e) { }

        if (geckoPath) {
            builder.setFirefoxService(new firefox.ServiceBuilder(geckoPath));
        }

        return await builder.build();
    } catch (e) {
        console.error('--- Driver indítási hiba ---', e);
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

        const isoTime = now.toISOString();
        const huTime = now.toLocaleString("hu-HU", {
            timeZone: "Europe/Budapest",
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        for (const entry of facilities) {
            console.log(`- Processing: ${entry.label}`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector?.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 10000);
                const raw = await el.getText();
                const free = parseInt(raw.match(/(\d+)/)[1], 10);

                results.push({
                    id: entry.id,
                    label: entry.label,
                    free: free,
                    total: Number(entry.maxLot),
                    url: entry.url // Itt veszi át a teljes URL-t a urls.json-ból
                });
            } catch (err) {
                console.error(`❌ Hiba (${entry.id}):`, err.message);
            }
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
                let statusClass = 'status-ok';
                if (p.free <= 10) statusClass = 'status-low';
                else if (p.free <= 50) statusClass = 'status-warn';

                return `
        <a href="${p.url}" target="_blank" class="card ${statusClass}">
            <div class="card-content">
                <h2>${p.label}</h2>
            </div>
            <div class="value">${p.free}</div>
            <div class="progress-container">
                <div class="progress-bar" style="width: ${Math.min(percent, 100)}%"></div>
            </div>
        </a>`;
            }).join('\n');

            // Beillesztés a sablonba
            html = html.replace('<main id="list">', `<main id="list">${cardsHtml}`);
            html = html.replace(/id="system-time">.*?<\/div>/, `id="system-time">${huTime}</div>`);
            html = html.replace(/data-generated=".*?"/, `data-generated="${isoTime}"`);

            fs.writeFileSync(targetHtmlPath, html);
            console.log('✅ index.html frissítve.');
        }

        // 3. MÁSOLÁS A PUBLIC MAPPÁBA (Ahogy kérted)
        ['index.html', 'style.css', 'script.js'].forEach(file => {
            const src = path.join(__dirname, file);
            const dest = path.join(outDir, file);
            if (fs.existsSync(src)) {
                fs.copyFileSync(src, dest);
            }
        });

        console.log('✨ Build kész!');

    } catch (globalErr) {
        console.error('💥 KRITIKUS HIBA:', globalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
})();