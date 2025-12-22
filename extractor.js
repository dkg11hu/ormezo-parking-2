const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    // --- ÚTVONALAK DEFINIÁLÁSA ---
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    // Cél útvonalak a public mappában
    const targetHtmlPath = path.join(publicDir, 'index.html');
    const targetStylePath = path.join(publicDir, 'style.css');
    const targetScriptPath = path.join(publicDir, 'script.js');

    // Forrás útvonalak az assetekhez
    const srcStylePath = path.join(__dirname, 'style.css');
    const srcScriptPath = path.join(__dirname, 'script.js');

    // Alapvető ellenőrzés
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

    let driver;
    try {
        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .build();

        let results = [];
        const now = new Date();
        const huTime = now.toLocaleTimeString('hu-HU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        const isoTime = now.toISOString();

        // --- ADATGYŰJTÉS ---
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

        // --- HTML GENERÁLÁS ÉS FÁJLKEZELÉS ---
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

            // extractor.js releváns része:
            html = html.replace(/id="col-p1-p2"[^>]*>([\s\S]*?)<\/div>/, `id="col-p1-p2">${p1p2}</div>`);
            html = html.replace(/id="col-p3-p4"[^>]*>([\s\S]*?)<\/div>/, `id="col-p3-p4">${others}</div>`);

            // Ez a sor garantáltan megtalálja a last-update div-et és beírja az ISO időt
            html = html.replace(
                /(id="last-update"\s+data-generated=").*?(")/, 
                `$1${isoTime}$2`
            );

            // Biztonság kedvéért a system-time-ot is töltsük fel kezdőértékkel
            html = html.replace(
                /(id="system-time">)(.*?)(<\/div>)/, 
                `$1${huTime}$3`
            );
            // 1. Biztosítjuk a public mappa létezését
            if (!fs.existsSync(publicDir)) {
                fs.mkdirSync(publicDir, { recursive: true });
            }

            // 2. Mentjük a generált HTML-t -> public/index.html
            fs.writeFileSync(targetHtmlPath, html);
            console.log(`✅ HTML legenerálva a public mappába.`);

            // 3. CSS másolása -> public/style.css
            if (fs.existsSync(srcStylePath)) {
                fs.copyFileSync(srcStylePath, targetStylePath);
                console.log('✅ style.css átmásolva.');
            }

            // 4. Script másolása -> public/script.js (2025-12-17-i szabály szerint)
            if (fs.existsSync(srcScriptPath)) {
                fs.copyFileSync(srcScriptPath, targetScriptPath);
                console.log('✅ script.js átmásolva.');
            }

            console.log(`🚀 Dashboard sikeresen frissítve és publikálásra kész: ${huTime}`);
        } else {
            console.error("❌ Hiba: index.template.html nem található a forrás könyvtárban!");
        }
    } catch (criticalErr) {
        console.error("❌ Kritikus Selenium hiba:", criticalErr.message);
    } finally {
        if (driver) await driver.quit();
    }
}

runExtractor();