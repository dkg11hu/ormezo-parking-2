const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

async function runExtractor() {
    const publicDir = path.join(__dirname, 'public');
    const urlsPath = path.join(__dirname, 'urls.json');
    const templatePath = path.join(__dirname, 'index.template.html');

    let options = new chrome.Options();
    options.addArguments('--headless=new');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--remote-allow-origins=*');

    // GitHub Actions környezetben a Chromium-ot keressük
    if (process.env.GITHUB_ACTIONS) {
        // Kipróbáljuk a lehetséges utakat, ahol a GH Actions tárolhatja a binárist
        const chromePaths = ['/usr/bin/chromium-browser', '/usr/bin/chromium', '/usr/bin/google-chrome'];
        for (const p of chromePaths) {
            if (fs.existsSync(p)) {
                options.setBinaryPath(p);
                console.log(`📍 Chrome bináris megtalálva: ${p}`);
                break;
            }
        }
    }

    let driver;
    try {
        console.log("🚀 Selenium indítása (Manual Driver Mode)...");

        // A workflow-ban telepített chromedriver használata
        const service = new chrome.ServiceBuilder('/usr/bin/chromedriver');

        driver = await new Builder()
            .forBrowser('chrome')
            .setChromeOptions(options)
            .setChromeService(service)
            .build();

        // ... scraping és HTML generálás marad a régi ...
        console.log("✅ Sikeres kinyerés.");
    } catch (err) {
        console.error("❌ Selenium hiba:", err.message);
        process.exit(1);
    } finally {
        if (driver) await driver.quit();
    }
}
runExtractor();