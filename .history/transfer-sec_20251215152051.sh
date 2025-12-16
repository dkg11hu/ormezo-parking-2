#!/bin/bash

# --- Configuration ---
# Set your GitHub repository owner and name
OWNER="dkg11hu"
REPO="ormezo-parking-2"

# File where the names will be saved
OUTPUT_FILE="github_config_names.txt"

# --- Script Start ---
echo "--- Fetching configuration names for $OWNER/$REPO ---" > "$OUTPUT_FILE"
echo " " >> "$OUTPUT_FILE"

# 1. Fetch Repository Variables
echo "### Repository Variables ###" >> "$OUTPUT_FILE"
# Variables are public and can be listed directly
gh variable list --repo "$OWNER/$REPO" --json name -q '.[].name' >> "$OUTPUT_FILE" 2>/dev/null

# 2. Fetch Repository Secrets
echo " " >> "$OUTPUT_FILE"
echo "### Repository Secrets (Names Only) ###" >> "$OUTPUT_FILE"
# Secrets can only have their names listed via the CLI for security
gh secret list --repo "$OWNER/$REPO" --json name -q '.[].name' >> "$OUTPUT_FILE" 2>/dev/null

# 3. Fetch Environment Variables (If you use Environments like 'production')
# If you use Environments, you'll need to specify the environment name here:
# echo " " >> "$OUTPUT_FILE"
# echo "### Environment Secrets (production) ###" >> "$OUTPUT_FILE"
# gh secret list --repo "$OWNER/$REPO" --env "production" --json name -q '.[].name' >> "$OUTPUT_FILE" 2>/dev/null

echo " " >> "$OUTPUT_FILE"
echo "--- Listing complete. ---"
echo "The names have been saved to $OUTPUT_FILE."
echo "You must now manually copy the values from GitHub Settings and populate your local .env file."

# Display the output file content for immediate reference
cat "$OUTPUT_FILE"