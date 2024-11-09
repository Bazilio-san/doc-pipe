#!/bin/bash

c='\033[0;35m'
y='\033[0;33m'
c0='\033[0;0m'
g='\033[0;32m'
set -e

SERVICE_NAME=`cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]'`
SERVICE_INSTANCE=`cat .env | grep SERVICE_INSTANCE | head -1 | awk -F= '{ print $2 }'`
if [ -z "$SERVICE_INSTANCE" ]
then
  SERVICE="${SERVICE_NAME}"
else
  SERVICE="${SERVICE_NAME}--${SERVICE_INSTANCE}"
fi

echo -e "$g========================================$c0"
echo -e "$g**** REGISTER SERVICE $y${SERVICE}$g ****$c0"
echo -e "$g========================================$c0"

pm2 delete $SERVICE || true
NODE_ENV=production pm2 startOrRestart pm2.config.js
pm2 save
pm2 ls
