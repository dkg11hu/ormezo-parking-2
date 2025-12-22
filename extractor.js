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
        const timestamp = now.getTime();

        for (const entry of facilities) {
            console.log(`⏳ Scrape: ${entry.label}...`);
            try {
                await driver.get(entry.url);
                const selector = entry.selector.css ? By.css(entry.selector.css) : By.xpath(entry.selector.xpath);
                const el = await driver.wait(until.elementLocated(selector), 15000);
                const rawText = await el.getText();
                const freeSpots = parseInt(rawText.match(/(\d+)/)[1], 10);

                results.push({
                    id: entry.id,
                    label: entry.label,
                    url: entry.url,
                    maxLot: entry.maxLot,
                    free: freeSpots
                });
            } catch (err) {
                console.error(`⚠️ Hiba (${entry.id}): ${err.message}`);
                results.push({
                    id: entry.id,
                    label: entry.label,
                    url: entry.url,
                    maxLot: entry.maxLot,
                    free: "N/A"
                });
            }
        }

        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            function generateCardHtml(res) {
                const label = res.label || res.id;
                const free = parseInt(res.free) || 0;
                const max = parseInt(res.maxLot) || 1;
                const url = res.url || "#";
                const percent = Math.min(Math.round((free / max) * 100), 100);
                const statusClass = percent > 50 ? 'status-ok' : (percent > 15 ? 'status-warn' : 'status-low');

                return `
      <a href="${url}" class="card ${statusClass}" target="_blank" style="--ratio: ${percent}%">
        <div class="card-inner">
          <div class="card-content-row">
            <h2>${label}</h2>
            <div class="value-container">
              <span class="value">${res.free === "N/A" ? "N/A" : free}</span>
              <span class="max-lot">/ ${max}</span>
            </div>
          </div>
        </div>
      </a>`;
            }

            const p1p2 = results.filter(r => r.id === 'p1' || r.id === 'p2').map(generateCardHtml).join('\n');
            const others = results.filter(r => r.id !== 'p1' && r.id !== 'p2').map(generateCardHtml).join('\n');

            html = html.replace(/(id="col-p1-p2"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${p1p2}\n$3`);
            html = html.replace(/(id="col-p3-p4"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${others}\n$3`);
            html = html.replace(/id="system-time">.*?<\/div>/, `id="system-time">${huTime}</div>`);
            html = html.replace(/data-generated="[^"]*"/, `data-generated="${timestamp}"`);

            if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
            fs.writeFileSync(targetHtmlPath, html);

            if (fs.existsSync(srcStylePath)) fs.copyFileSync(srcStylePath, targetStylePath);
            if (fs.existsSync(srcScriptPath)) fs.copyFileSync(srcScriptPath, targetScriptPath);
            if (fs.existsSync('favicon.svg')) fs.copyFileSync('favicon.svg', 'public/favicon.svg');

            console.log(`✅ Adatok frissítve: ${huTime}`);
        }
    } catch (criticalErr) {
        console.error("❌ Hiba:", criticalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
}

runExtractor();