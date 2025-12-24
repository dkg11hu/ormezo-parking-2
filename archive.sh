mkdir -p archive
tar -czvf archive/ormezo_parking_full_$(date +%Y-%m-%d_%H-%M-%S).tgz \
    --exclude='./node_modules' \
    --exclude='./.history' \
    --exclude='./archive' \
    --exclude='./.git' \
    --exclude='./.devcontainer' \
    --exclude='./google*' \
    --exclude='gecko*' \
    --exclude='!*.tgz' \
    .
echo ""        
echo ">>>>>>>>>>>>  FULL archive is done <<<<<<<<<<<<<<<"

tar -czvf archive/ormezo_parking_working_components_$(date +%Y-%m-%d_%H-%M-%S).tgz \
        index.template.html \
        script.js \
        urls.json \
        server.js \
        favicon.svg \
        extractor.js \
        style.css \
        package.json \
        .github/workflows/schedule.yml

echo ""        
echo ">>>>>>>>>>>>  COMPONENTS archive is done <<<<<<<<<<<<<<<"
