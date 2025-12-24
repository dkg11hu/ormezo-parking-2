gh run list --workflow schedule.yml --limit 100 | grep -oE '[0-9]{10,}' | tail -n +2 | xargs -I{} gh run delete {}
