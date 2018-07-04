# Mobile Web Specialist - Restaurant Reviews - Stage 2

Part 2 of 3 for the Restaurant Reviews App. This project is part of the Udacity Mobile Web Specialist nanodegree.

## Config

Replace `YOUR_GOOGLE_MAPS_API_KEY` by a valid Google Maps Javascript API key at:

- `index.html:49`
- `restaurant.html:56`

# Build

Install packages:
`yarn`
or:
`npm install`

Build dist folder:
`yarn run gulp`
or:
`npm run gulp`

## How to run

Run a localhost server:

- Web Server for Chrome extension (serve the gulp generated `dist` folder)

The application will be served at: http://localhost:8887.

## Dependency - Data provider server

The data server can be found at https://github.com/cassioconti/mws-restaurant-data-server. It is a simple fork of the Udacity provided data server.

## Cleanup

(Optional) Remove dist folder:
`yarn run gulp clean`
or:
`npm run gulp clean`
