# Őrmező Parking

[![CI](https://github.com/dkg11hu/ormezo-parking/actions/workflows/ci.yml/badge.svg)](https://github.com/dkg11hu/ormezo-parking/actions/workflows/ci.yml)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green?logo=node.js)](https://nodejs.org/)
[![GitHub release](https://img.shields.io/github/v/release/dkg11hu/ormezo-parking?logo=github)](RELEASE_NOTES.md)
[![Semantic Versioning](https://img.shields.io/badge/semver-2.0.0-blue)](https://semver.org/)
[![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-2.1-4baaaa.svg)](CODE_OF_CONDUCT.md)
[![Contributing](https://img.shields.io/badge/Contributing-Guide-green.svg)](CONTRIBUTING.md)
[![Security Policy](https://img.shields.io/badge/Security-Policy-green.svg)](SECURITY.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

---

## Overview

Real-time extractor and dashboard for monitoring **Őrmező (Budapest) P+R** parking availability.  
Optimized for **iPhone XS OLED** displays, providing an ultra-fast, no-scroll experience with high-contrast "shining" typography. Built with **Node.js**, **Selenium**, and automated via **GitHub Actions**.

## 📱 iPhone XS Optimization

- **Dynamic Viewport:** Uses `100dvh` to fit the dashboard perfectly within Safari's frame without scrolling.
- **OLED Black Theme:** Pure `#000` background for maximum energy efficiency and contrast.
- **Shining Typography:** Labels feature a subtle glow (`text-shadow`) and pure white color for high legibility.
- **Vivid Status:** Data freshness ("X mp-cel ezelőtt") is highlighted in neon blue (`#00d4ff`).
- **Full-Surface Touch:** Each parking card is a clickable `<a>` tag for easy one-handed navigation.

## Quickstart

```bash
git clone [https://github.com/dkg11hu/ormezo-parking.git](https://github.com/dkg11hu/ormezo-parking.git)
cd ormezo-parking
npm install
make extract
make build
```

## 🛠 Project Logic

### File,Responsibility
extractor.js,Selenium scraper that fetches live data and generates index.html.
urls.json,Source configuration (URLs and CSS selectors).
style.css,"XS-optimized ""Shining White"" stylesheet."
public/,Deployment-ready folder containing synced assets.

## CI/CD
Automated Extraction: Scheduled Selenium runs via GitHub Actions.

Auto-Sync: Build process automatically copies index.html, style.css, and script.js to the public/ directory.

Semantic versioning: Automated GitHub Releases.

```bash
make extract
```

## Runtime Flow
```Plaintext
Selenium (Geckodriver) → urls.json → parking-status.json → index.html
```
