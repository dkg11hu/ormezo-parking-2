# Őrmező Parking Dashboard 🚗

[![CI](https://github.com/dkg11hu/ormezo-parking/actions/workflows/schedule.yml/badge.svg)](https://github.com/dkg11hu/ormezo-parking/actions/workflows/schedule.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green?logo=node.js)](https://nodejs.org/)

A real-time (updated every 15 minutes) dashboard monitoring parking spot availability in the Őrmező area. The system scrapes public data, generates a responsive "Cyberpunk-style" dashboard, and hosts it via GitHub Pages.

## 🌟 Features
- **Automated Extraction**: Scrapes parking data using Selenium (Firefox Headless).
- **Static Site Generation**: Injects live data into a pre-defined HTML template.
- **Responsive Design**: Optimized for both Portrait (mobile) and Landscape (tablet/kiosk) orientations.
- **Visual Status Indicators**: Color-coded cards (Green/Yellow/Red) based on occupancy levels.
- **Data Freshness**: Includes a live "time-since-update" counter and system clock. 

## 🛠️ Tech Stack
- **Backend/Scraper**: Node.js, Selenium WebDriver (Geckodriver/Firefox).
- **CI/CD**: GitHub Actions (scheduled CRON jobs).
- **Frontend**: Vanilla JS, CSS3 (Flexbox/Grid), HTML5.
- **Hosting**: GitHub Pages.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Firefox Browser (for local scraping)

### Local Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/dkg11hu/ormezo-parking.git](https://github.com/dkg11hu/ormezo-parking.git)
   cd ormezo-parking

### Install dependencies:

   ```bash
    npm install
   ```

### Create a urls.json file in the root directory (see Configuration).

### Run the extractor locally:

   ```bash
    node extractor.js
   ```

### Open public/index.html to view the result.

## ⚙️ Configuration
The scraper requires a urls.json file to define the parking facilities. Example structure:

    ```JSON

[
  {
    "id": "p1",
    "label": "P+R P1",
    "url": "[https://example.com/parking1](https://example.com/parking1)",
    "selector": { "css": ".free-spots-class" },
    "maxLot": 500
  }
]
    ```

    This project is a streamlined, automated parking availability dashboard for Őrmező. It uses a headless Firefox scraper (via Selenium) to fetch data, processes it into a static HTML dashboard, and deploys it automatically to GitHub Pages every 15 minutes.

Based on the files provided, I have drafted a comprehensive suite of GitHub documentation files for you.

1. README.md
This is the main entry point for your repository. It explains what the project does and how to set it up.

Markdown

# Őrmező Parking Dashboard 🚗

[![CI](https://github.com/dkg11hu/ormezo-parking/actions/workflows/schedule.yml/badge.svg)](https://github.com/dkg11hu/ormezo-parking/actions/workflows/schedule.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-green?logo=node.js)](https://nodejs.org/)

A real-time (updated every 15 minutes) dashboard monitoring parking spot availability in the Őrmező area. The system scrapes public data, generates a responsive "Cyberpunk-style" dashboard, and hosts it via GitHub Pages.

## 🌟 Features
- **Automated Extraction**: Scrapes parking data using Selenium (Firefox Headless).
- **Static Site Generation**: Injects live data into a pre-defined HTML template.
- **Responsive Design**: Optimized for both Portrait (mobile) and Landscape (tablet/kiosk) orientations.
- **Visual Status Indicators**: Color-coded cards (Green/Yellow/Red) based on occupancy levels.
- **Data Freshness**: Includes a live "time-since-update" counter and system clock.

## 🛠️ Tech Stack
- **Backend/Scraper**: Node.js, Selenium WebDriver (Geckodriver/Firefox).
- **CI/CD**: GitHub Actions (scheduled CRON jobs).
- **Frontend**: Vanilla JS, CSS3 (Flexbox/Grid), HTML5.
- **Hosting**: GitHub Pages.

## 🚀 Getting Started

### Prerequisites
- Node.js (v20 or higher)
- Firefox Browser (for local scraping)

### Local Installation
1. Clone the repository:
   ```bash
   git clone [https://github.com/dkg11hu/ormezo-parking.git](https://github.com/dkg11hu/ormezo-parking.git)
   cd ormezo-parking

### Install dependencies:
   ```bash
   npm install
   ```

### Create a urls.json file in the root directory (see Configuration).

### Run the extractor locally:

   ```bash
   node extractor.js
   ```

### Open public/index.html to view the result.

## ⚙️ Configuration
The scraper requires a urls.json file to define the parking facilities. Example structure:

   ```JSON
[
  {
    "id": "p1",
    "label": "P+R P1",
    "url": "[https://example.com/parking1](https://example.com/parking1)",
    "selector": { "css": ".free-spots-class" },
    "maxLot": 500
  }
]
   ```

## 🤖 CI/CD Workflow
The project uses GitHub Actions (schedule.yml):
Triggers: Runs every 15 minutes, on every push to main, or via manual dispatch.

Process:
- Checks out code.
- Sets up Firefox/Geckodriver.
- Runs extractor.js to generate the public/ folder.
- Automatically copies script.js, style.css, and index.html to the deployment directory.
- Deploys the contents of public/ to the gh-pages branch.

