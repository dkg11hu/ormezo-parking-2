const { Builder, By, until } = require('selenium-webdriver');
const firefox = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');
const facilities = require(path.resolve(__dirname, 'urls.json'));

// --- FIX: Define the template path and the output path ---
const TEMPLATE_PATH = path.join(__dirname, 'index.template.html'); // New template file name
const outPath = path.join(__dirname, 'public', 'parking-status.json');
const tmpPath = outPath + '.tmp';
// ---------------------------------------------------------


// Set this to "free" or "used" depending on how you want bars rendered
const BAR_MODE = 'free'; // 'free' or 'used'

const runId = Date.now();
console.log('EXTRACTOR START pid=' + process.pid + ' run=' + runId);

function safePercent(free, total) {
  const f = Number(free);
  const t = Number(total);
  if (!Number.isFinite(f) || !Number.isFinite(t) || t <= 0) return null;

  const value = BAR_MODE === 'used' ? (t - f) : f;
  const pct = (value / t) * 100;
  const clamped = Math.max(0, Math.min(100, pct));
  return Number.isFinite(clamped) ? Number(clamped.toFixed(2)) : null;
}

process.on('SIGTERM', () => {
  console.log('Extractor received SIGTERM, exiting run=' + runId);
  process.exit(1);
});

(async function main() {
  let driver;
  try {
    driver = await new Builder()
      .forBrowser('firefox')
      .setFirefoxOptions(new firefox.Options().addArguments('--headless'))
      .build();

    const results = [];

    for (const entry of facilities) {
      console.log(`\n=== Processing ${entry.label} (${entry.id}) ===`);
      console.log(`[${entry.id}] Using URL from urls.json: ${entry.url}`);
      await driver.get(entry.url);

      // Occupancy extraction with short-circuit
      let raw = '';
      let free = 0;
      const total = Number(entry.maxLot);
      const strictPattern = new RegExp(`^(\\d+)\\s*/\\s*${entry.maxLot}$`);

      if (!raw && entry.selector?.css) {
        try {
          const elCss = await driver.wait(
            until.elementLocated(By.css(entry.selector.css)),
            7000
          );
          raw = await elCss.getText();
          console.log(`[${entry.id}] Found via CSS: "${raw}"`);
        } catch {
          console.warn(`[${entry.id}] CSS selector failed`);
        }
      }
      if (raw && strictPattern.test(raw.trim())) {
        free = parseInt(raw.trim().match(strictPattern)[1], 10);
      } else {
        if (!raw && entry.selector?.xpath) {
          try {
            const elXpath = await driver.wait(
              until.elementLocated(By.xpath(entry.selector.xpath)),
              7000
            );
            raw = await elXpath.getText();
            console.log(`[${entry.id}] Found via XPath: "${raw}"`);
          } catch {
            console.warn(`[${entry.id}] XPath selector failed`);
          }
        }
        if (raw && strictPattern.test(raw.trim())) {
          free = parseInt(raw.trim().match(strictPattern)[1], 10);
        } else {
          if (!raw) {
            try {
              const pageText = await driver.findElement(By.css('body')).getText();
              const regexAny = new RegExp(`(\\d+)\\s*/\\s*${entry.maxLot}`);
              const matchAny = pageText.match(regexAny);
              if (matchAny) {
                raw = matchAny[0];
                console.log(`[${entry.id}] Found via regex: "${raw}"`);
              }
            } catch {
              console.warn(`[${entry.id}] Regex fallback failed`);
            }
          }
          if (raw && strictPattern.test(raw.trim())) {
            free = parseInt(raw.trim().match(strictPattern)[1], 10);
          } else {
            raw = `000 / ${entry.maxLot}`;
            console.error(`[${entry.id}] Occupancy not found, defaulting to "${raw}"`);
          }
        }
      }

      // Timestamp extraction via XPath only
      let updated = 'N/A';
      if (entry.timestampSelector?.xpath) {
        try {
          const tsXpath = await driver.wait(
            until.elementLocated(By.xpath(entry.timestampSelector.xpath)),
            7000
          );
          updated = await tsXpath.getText();
          console.log(`[${entry.id}] Timestamp via XPath: "${updated}"`);
        } catch {
          console.warn(`[${entry.id}] Timestamp XPath failed`);
        }
      }

      results.push({
        id: entry.id,
        label: entry.label,
        free,
        total,
        updated
      });

      console.log(
        `[${entry.id}] RESULT: Free=${free}, Total=${total}, Last updated=${updated}`
      );
    }

    // Header timestamp
    const validTimestamps = results.map(r => r.updated).filter(t => t && t !== 'N/A');
    const headerTimestamp = validTimestamps.length
      ? validTimestamps.sort().slice(-1)[0]
      : 'N/A';

    // Build rows (This logic remains here as it's data manipulation)
    const rows = results.map(r => {
      const percent = safePercent(r.free, r.total);
      const unknown = percent === null;
      const cls =
        unknown ? 'unknown' :
        (BAR_MODE === 'free'
          ? (r.free <= 5 ? 'low' : 'free')
          : ((r.total - r.free) >= r.total - 5 ? 'low' : 'free'));

      const widthStyle = unknown ? '0%' : `${percent}%`;
      const labelText = BAR_MODE === 'free'
        ? `${r.free}`
        : `${r.total - r.free}`;

      const aria = BAR_MODE === 'free'
        ? `Szabad: ${r.free}/${r.total} (${percent ?? 0}%)`
        : `Foglalt: ${r.total - r.free}/${r.total} (${percent ?? 0}%)`;

      return `
      <tr class="${cls}">
        <td>${r.label}</td>
        <td>
          <div class="bar" title="${aria}">
            <div class="fill" style="width:${widthStyle}"></div>
          </div>
          ${labelText}
        </td>
        <td>${r.total}</td>
        <td class="timestamp">${r.updated}</td>
      </tr>`;
    }).join('\n');

    // --- START OF TEMPLATING FIX ---
    // Read the template file content
    let htmlTemplate;
    try {
        htmlTemplate = fs.readFileSync(TEMPLATE_PATH, 'utf8');
    } catch (e) {
        console.error(`ERROR: Could not read HTML template from ${TEMPLATE_PATH}. Ensure the file exists!`, e);
        process.exitCode = 1;
        throw e;
    }

    // Perform data injection (requires the template to have and placeholders)
    const finalHtml = htmlTemplate
        .replace('', rows)
        .replace('', headerTimestamp);
    // --- END OF TEMPLATING FIX ---


    // === Write outputs atomically ===
    // ensure public dir exists
    const outDir = path.resolve(__dirname, 'public');
    if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

    // 1. Write JSON data
    const jsonPath = path.join(outDir, 'parking-status.json');
    const jsonTmp = jsonPath + '.tmp';
    fs.writeFileSync(jsonTmp, JSON.stringify(results, null, 2), 'utf8');
    fs.renameSync(jsonTmp, jsonPath);

    // 2. Write the final, user-facing index.html report
    const htmlPath = path.join(outDir, 'index.html'); // The correct final name
    const htmlTmp = htmlPath + '.tmp';
    fs.writeFileSync(htmlTmp, finalHtml, 'utf8'); // Use the injected HTML content
    fs.renameSync(htmlTmp, htmlPath);

    console.log('Generated public/index.html and public/parking-status.json'); // Correct log message
  } catch (err) {
    console.error('Extractor failed:', err);
    process.exitCode = 1;
    throw err;
  } finally {
    if (driver) {
      try {
        await driver.quit();
      } catch (e) {
        console.warn('Error quitting driver:', e);
      }
    }
    console.log('EXTRACTOR END pid=' + process.pid + ' run=' + runId);
  }
})();