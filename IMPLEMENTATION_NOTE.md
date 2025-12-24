# Implementation Note
I noticed that your extractor.js already includes the logic to copy assets to the public folder as per your instructions:

    ```bash
        fs.copyFileSync(srcStylePath, targetStylePath);

        fs.copyFileSync(srcScriptPath, targetScriptPath);
    ```
This ensures that whenever the GitHub Action runs, your public folder (which is what GitHub Pages serves) is always in sync with your latest source code.