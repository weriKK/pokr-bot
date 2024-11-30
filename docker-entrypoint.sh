#!/bin/sh

if [ "$DEPLOY_COMMANDS" = "true" ]; then
    echo "Deploying commands..."
    node deploy-commands.js
else
    echo "Starting bot..."
    node index.js
fi 