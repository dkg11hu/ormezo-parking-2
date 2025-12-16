#!/bin/bash

# --- Configuration ---
# Set the GitHub Token for authentication (read from environment)
if [ -z "$GH_TOKEN" ]; then
    echo "ERROR: GH_TOKEN environment variable is not set."
    echo "Please set it before running this script (e.g., export GH_TOKEN=...)."
    exit 1
fi

echo "--- Starting Immediate Workflow Cleanup via GitHub CLI ---"

# --- Main Logic ---

# 1. Get unique names of all workflows
# Use gh to list runs, extract names, sort, and get unique values.
WORKFLOW_NAMES=$(gh run list --limit 100 --json name -q '.[].name' 2>/dev/null | sort | uniq)

if [ -z "$WORKFLOW_NAMES" ]; then
    echo "No workflow runs found to process. Exiting."
    exit 0
fi

# 2. Loop through each workflow name
# Use a here-string and read -r to correctly handle newline-separated input.
echo "$WORKFLOW_NAMES" | while IFS= read -r WF_NAME; do
    
    if [ -z "$WF_NAME" ]; then
        continue
    fi

    echo "Processing Workflow: $WF_NAME"

    # 3. Get all run IDs for the current workflow (newest first)
    # The default gh run list order is newest first.
    ALL_RUN_IDS=$(gh run list --workflow="$WF_NAME" --limit 1000 --json databaseId -q '.[].databaseId' 2>/dev/null)

    # 4. Filter: Skip the newest run ID (the first line), and keep the rest for deletion
    # tail -n +2 skips the first line (the newest run ID).
    IDS_TO_DELETE=$(echo "$ALL_RUN_IDS" | tail -n +2)

    if [ -z "$IDS_TO_DELETE" ]; then
        echo "  Only the latest run remains, or less than 2 runs found. Skipping."
    else
        # 5. Delete all older runs in the list
        DELETE_COUNT=$(echo "$IDS_TO_DELETE" | wc -l)
        echo "  Marked for deletion: $DELETE_COUNT runs."
        
        # Execute mass deletion via piping to xargs
        # -r: No run if input is empty; -n 1: Run one command per input line
        # This will send the DELETE request for each run ID.
        echo "$IDS_TO_DELETE" | xargs -r -n 1 gh run delete
        
        echo "  Deletion requests submitted."
    fi
    echo "---"
done

echo "Automated cleanup complete."
