FROM ubuntu

# Copy all base files to the application
COPY node_modules /srv/app/node_modules
COPY output /srv/app/output
COPY mocks /srv/app/mocks
COPY servers /srv/app/servers
COPY OutputExports.js /srv/app
COPY bower_components /srv/app/bower_components
COPY fleet/fleet-common /srv/app/fleet/fleet-common

RUN apt-get update && apt-get -qq update && apt-get -qq -y install build-essential python make g++ node && npm install -g node-gyp && /usr/local/bin/node /srv/app/node_modules/fibers/build
