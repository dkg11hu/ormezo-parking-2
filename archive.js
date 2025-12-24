const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const now = new Date();
const timestamp = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 16);
const archiveRoot = path.join(__dirname, 'archives');
const buildName = `full_archive_${timestamp}`;
const archiveDir = path.join(archiveRoot, buildName);

console.log(`📦 Teljes projekt archiválása: ${buildName}...`);

try {
    // 1. Archívum könyvtár előkészítése
    if (!fs.existsSync(archiveRoot)) fs.mkdirSync(archiveRoot);
    if (fs.existsSync(archiveDir)) fs.rmSync(archiveDir, { recursive: true });
    fs.mkdirSync(archiveDir, { recursive: true });

    // 2. Mit mentsünk el? (Kód + Config + Eredmény)
    const itemsToArchive = [
        '.github',
        'public',
        'extractor.js',
        'builder.js',
        'archive.js',
        'test-build.js',
        'index.template.html',
        'style.css',
        'script.js',
        'package.json'
    ];

    itemsToArchive.forEach(item => {
        const src = path.join(__dirname, item);
        const dest = path.join(archiveDir, item);

        if (fs.existsSync(src)) {
            if (fs.lstatSync(src).isDirectory()) {
                fs.cpSync(src, dest, { recursive: true });
            } else {
                fs.copyFileSync(src, dest);
            }
        }
    });

    // 3. Tömörítés
    process.chdir(archiveRoot);

    if (process.platform === 'win32') {
        // Windows (zip)
        execSync(`powershell Compress-Archive -Path ${buildName}/* -DestinationPath ${buildName}.zip`);
        console.log(`✅ ZIP elkészült: archives/${buildName}.zip`);
    } else {
        // Linux / Codespaces (tgz)
        execSync(`tar -czf ${buildName}.tgz ${buildName}`);
        console.log(`✅ TGZ elkészült: archives/${buildName}.tgz`);
    }

    // 4. Ideiglenes mappa törlése (csak a tömörített fájl marad)
    fs.rmSync(archiveDir, { recursive: true });

    console.log(`✨ Archiválás sikeresen befejezve.`);

} catch (err) {
    console.error(`❌ Archiválási hiba: ${err.message}`);
}