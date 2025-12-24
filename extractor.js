const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const chromedriver = require('chromedriver');
const fs = require('fs');
const path = require('path');

async function runBuild() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
    }

    let options = new chrome.Options();
    options.addArguments('--headless=new', '--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--disable-setuid-sandbox');

    const targetBinary = '/usr/bin/google-chrome';
    if (fs.existsSync(targetBinary)) {
        options.setBinaryPath(targetBinary);
    }

    const service = new chrome.ServiceBuilder(chromedriver.path);
    let driver;

    try {
        console.log("🛠️ Initializing browser...");
        driver = await new Builder().forBrowser('chrome').setChromeOptions(options).setChromeService(service).build();

        const config = JSON.parse(fs.readFileSync(urlsPath, 'utf8'));
        const results = {};

        // 1. DATA EXTRACTION
        for (const lot of config) {
            console.log(`🔍 Scraping ${lot.label}...`);
            try {
                await driver.get(lot.url);
                const locator = lot.selector.xpath ? By.xpath(lot.selector.xpath) : By.css(lot.selector.css);
                const element = await driver.wait(until.elementLocated(locator), 15000);
                const rawText = await element.getText();

                // FIX: Take only the first number found to prevent merging 447 and 485
                const firstPart = rawText.trim().split(/[\s\n/]+/)[0];
                results[lot.id] = firstPart.replace(/\D/g, '') || "0";
            } catch (e) {
                results[lot.id] = "N/A";
            }
        }

        // 2. HTML GENERATION
        const timestampMs = Date.now();
        const cardsHtml = config.map(lot => {
            const free = parseInt(results[lot.id]) || 0;
            const max = lot.maxLot || 1;
            const ratio = Math.min(Math.round((free / max) * 100), 100);

            let statusClass = 'status-ok';
            if (ratio < 15) statusClass = 'status-low';
            else if (ratio < 40) statusClass = 'status-warn';

            return `
            <a href="${lot.url}" target="_blank" rel="noopener" class="card-link">
                <div class="card ${statusClass}" style="--ratio: ${ratio}%">
                    <div class="card-content-row">
                        <h2>${lot.label}</h2>
                        <div class="value-container">
                            <span class="value">${results[lot.id]}</span>
                            <span class="max-lot">/ ${max}</span>
                        </div>
                    </div>
                </div>
            </a>`;
        }).join('\n');

        // 1. Prepare the Grid with a unique ID for the relative time text
        const newGridHtml = `<div id="dashboard-grid">
            ${cardsHtml}
        </div>`;

        const template = fs.readFileSync(templatePath, 'utf8');

        // 2. Inject the timestamp into your existing header span
        let finalHtml = template.replace(
            'id="last-update" class="info-value">--:--:--',
            `id="last-update" class="info-value" data-timestamp="${timestampMs}">--:--:--`
        );

        // 3. Inject the grid and assets
        const gridRegex = /<div id="dashboard-grid">[\s\S]*?<\/div>/;
        finalHtml = finalHtml.replace(gridRegex, newGridHtml);
        finalHtml = finalHtml.replace(/BUILD_ID/g, timestampMs);

        fs.writeFileSync(path.join(publicDir, 'index.html'), finalHtml);

        // Mirror Assets
        ['style.css', 'script.js'].forEach(file => {
            const src = path.join(__dirname, file);
            if (fs.existsSync(src)) fs.copyFileSync(src, path.join(publicDir, file));
        });

        console.log("✅ Build Assembly Complete");

    } catch (err) {
        console.error("❌ Fatal Error:", err.message);
    } finally {
        if (driver) await driver.quit();
    }
}
runBuild();