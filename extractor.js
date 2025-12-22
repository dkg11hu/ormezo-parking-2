const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/firefox');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    const targetHtmlPath = path.join(publicDir, 'index.html');
    const targetStylePath = path.join(publicDir, 'style.css');
    const targetScriptPath = path.join(publicDir, 'script.js');

    const srcStylePath = path.join(__dirname, 'style.css');
    const srcScriptPath = path.join(__dirname, 'script.js');

    if (!fs.existsSync(urlsPath)) {
        console.error("❌ urls.json hiányzik!");
        return;
    }
    const facilities = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

    // Firefox beállítások (Headless mód GitHub Actions-höz)
    let options = new firefox.Options();
    options.addArguments('--headless');

    let driver;
    try {
        driver = await new Builder()
            .forBrowser('firefox')
            .setFirefoxOptions(options)
            .build();

        let results = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isoTime = now.toISOString();
        const timestamp = now.getTime(); // ISO helyett tiszta szám (ezredmásodperc)

        for (const entry of facilities) {
            console.log(`⏳ Scrape: ${entry.label}...`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 15000);
                const rawText = await el.getText();
                const freeSpots = parseInt(rawText.match(/(\d+)/)[1], 10);
                results.push({ id: entry.id, free: freeSpots });
            } catch (err) {
                console.error(`⚠️ Hiba (${entry.id}): ${err.message}`);
                results.push({ id: entry.id, free: "N/A" });
            }
        }

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const generateCardHtml = (result) => {
                const config = facilities.find(f => f.id === result.id);
                let statusClass = 'status-ok';
                if (result.free === "N/A" || result.free <= 10) statusClass = 'status-low';
                else if (result.free <= 50) statusClass = 'status-warn';

                return `
                <a href="${config.url}" target="_blank" class="card ${statusClass}">
                    <div class="card-inner">
                        <h2>${config.label}</h2>
                        <div class="value-container">
                            <span class="value">${result.free}</span>
                            <span class="max-lot">/ ${config.maxLot}</span>
                        </div>
                    </div>
                </a>`;
            };

            const p1p2 = results.filter(r => r.id === 'p1' || r.id === 'p2').map(generateCardHtml).join('\n');
            const others = results.filter(r => r.id !== 'p1' && r.id !== 'p2').map(generateCardHtml).join('\n');

            // HTML frissítés (A pontos ID-kat használva)
            html = html.replace(/(id="col-p1-p2"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${p1p2}\n$3`);
            html = html.replace(/(id="col-p3-p4"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${others}\n$3`);
            // html = html.replace(/(id="last-update"\s+data-generated=").*?(")/, `$1${isoTime}$2`);
            html = html.replace(/id="system-time">.*?<\/div>/, `id="system-time">${huTime}</div>`);
            html = html.replace(/(id="last-update"\s+data-generated=").*?(")/, `$1${timestamp}$2`);
            html = html.replace(/data-generated="[^"]*"/, `data-generated="${timestamp}"`);

            // Mentés a public mappába
            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(targetHtmlPath, html);

            // Assetek másolása (2025-12-17 szabály szerint)
            if (fs.existsSync(srcStylePath)) fs.copyFileSync(srcStylePath, targetStylePath);
            if (fs.existsSync(srcScriptPath)) fs.copyFileSync(srcScriptPath, targetScriptPath);
            if (fs.existsSync('favicon.png')) fs.copyFileSync('favicon.png', 'public/favicon.png');
            console.log(`✅ Minden fájl készen áll a public/ mappában.`);
        }
    } catch (criticalErr) {
        console.error("❌ Hiba:", criticalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
}

runExtractor();