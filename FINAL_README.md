# Őrmező Parking Dashboard 🚗
A real-time (updated every 15 minutes) dashboard monitoring parking spot availability in the Őrmező area. The system scrapes public data, generates a responsive "Cyberpunk-style" dashboard, and hosts it via GitHub Pages.

🌟 Features
Automated Extraction: Scrapes parking data using Selenium (Chrome Headless).

Static Site Generation: Injects live data into a pre-defined HTML template.

Responsive Design: Optimized for both Portrait (mobile) and Landscape (tablet/kiosk) orientations.

Visual Status Indicators: Color-coded cards (Green/Yellow/Red) based on occupancy levels.

Data Freshness: Includes a live "time-since-update" counter and system clock.

🛠️ Tech Stack
Backend/Scraper: Node.js, Selenium WebDriver (Chrome).

CI/CD: GitHub Actions (scheduled CRON jobs).

Frontend: Vanilla JS, CSS3 (Flexbox/Grid), HTML5.

Hosting: GitHub Pages.

🚀 Getting Started
Prerequisites
Node.js (v20 or higher)

Chrome Browser (for local scraping)

Local Installation
Clone the repository: 

```
 git clone https://github.com/dkg11hu/ormezo-parking.git cd ormezo-parking 
```


Install dependencies: 
```
 npm install 
```


Run the extractor locally: 
```
 node extractor.js 
```


Open public/index.html to view the result.

⚙️ Configuration
The scraper uses a urls.json file to define the parking facilities. Example structure:


```
 [ { "id": "p1", "label": "Őrmező P1", "url": "https://example.com/parking1", "selector": { "css": ".free-spots-class" }, "maxLot": 485 } ] 
```


🤖 CI/CD Workflow
The project uses GitHub Actions (schedule.yml):

Triggers: Runs every 15 minutes, on every push to main, or via manual dispatch.

Process:

Checks out code and sets up Node.js.

Runs extractor.js to generate the public/ folder.

Asset Sync: Per custom instructions, script.js, style.css, and index.html are always copied from the main branch to the public folder before deployment.

Deploys the contents of public/ to the gh-pages branch.

🏷️ Archival
The last known stable baseline is archived under the git tag: v1.0.0-working.

Created by dkg11hu - 2025 
```


Would you like me to help you set up the LICENSE file text next?