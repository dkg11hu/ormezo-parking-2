const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');
    const targetPath = path.join(__dirname, 'public', 'index.html');
    const styleSrc = path.join(__dirname, 'style.css');
    const styleDest = path.join(__dirname, 'public', 'style.css');

    if (!fs.existsSync(urlsPath)) {
        console.error("❌ Hiba: urls.json nem található!");
        return;
    }
    const facilities = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));

    // --- ROBUSZTUS SELENIUM BEÁLLÍTÁSOK ---
    let options = new chrome.Options();
    options.addArguments(
        '--headless=new',
        '--no-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1920,1080'
    );

    // --- JAVÍTOTT PÉLDÁNYOSÍTÁS ---
    let driver;
    try {
        const service = new chrome.ServiceBuilder(); // Alapértelmezett service

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            // Biztosítjuk, hogy ne legyen ütközés a portok között
            .build();

        let results = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isoTime = now.toISOString();

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

        // --- HTML GENERÁLÁS (urls.json adatokkal) ---
        if (fs.existsSync(templatePath)) {
            let html = fs.readFileSync(templatePath, 'utf8');

            const generateCardHtml = (result) => {
                const config = facilities.find(f => f.id === result.id);
                let statusClass = 'status-ok';

                if (result.free === "N/A") statusClass = 'status-low';
                else if (result.free <= 10) statusClass = 'status-low';
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

            html = html.replace(/(id="col-p1-p2"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${p1p2}\n$3`);
            html = html.replace(/(id="col-p3-p4"[^>]*>)([\s\S]*?)(<\/div>)/, `$1\n${others}\n$3`);
            html = html.replace(/id="system-time">.*?<\/div>/, `id="system-time">${huTime}</div>`);
            html = html.replace(/data-generated=".*?"/, `data-generated="${isoTime}"`);

            if (!fs.existsSync(path.dirname(targetPath))) fs.mkdirSync(path.dirname(targetPath), { recursive: true });
            fs.writeFileSync(targetPath, html);

            // Automatikus CSS másolás a szabály szerint
            if (fs.existsSync(styleSrc)) fs.copyFileSync(styleSrc, styleDest);

            console.log(`✅ Dashboard frissítve: ${huTime}`);
        }
    } catch (criticalErr) {
        console.error("❌ Kritikus Selenium hiba:", criticalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
}

runExtractor();