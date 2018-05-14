#!/bin/bash

set -e
set -x

if [ -f OutputExports.js ]; then
    rm OutputExports.js
fi

cd build

echo "Creating master exports"
node CreateMasterExports.js
