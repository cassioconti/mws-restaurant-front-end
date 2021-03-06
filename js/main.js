/*global google*/
const DBHelper = require('./dbhelper');
const self = {};
self.markers = [];

/**
 * Fetch neighborhoods and cuisines as soon as the page is loaded.
 */
document.addEventListener('DOMContentLoaded', () => {
    fetchNeighborhoods();
    fetchCuisines();
});

/**
 * Fetch all neighborhoods and set their HTML.
 */
function fetchNeighborhoods() {
    DBHelper.fetchNeighborhoods((error, neighborhoods) => {
        if (error) { // Got an error
            console.error(error);
        } else {
            self.neighborhoods = neighborhoods;
            fillNeighborhoodsHTML();
        }
    });
}

/**
 * Set neighborhoods HTML.
 */
function fillNeighborhoodsHTML(neighborhoods = self.neighborhoods) {
    const select = document.getElementById('neighborhoods-select');
    neighborhoods.forEach(neighborhood => {
        const option = document.createElement('option');
        option.innerHTML = neighborhood;
        option.value = neighborhood;
        select.append(option);
    });
}

/**
 * Fetch all cuisines and set their HTML.
 */
function fetchCuisines() {
    DBHelper.fetchCuisines((error, cuisines) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.cuisines = cuisines;
            fillCuisinesHTML();
        }
    });
}

/**
 * Set cuisines HTML.
 */
function fillCuisinesHTML(cuisines = self.cuisines) {
    const select = document.getElementById('cuisines-select');

    cuisines.forEach(cuisine => {
        const option = document.createElement('option');
        option.innerHTML = cuisine;
        option.value = cuisine;
        select.append(option);
    });
}

function onMapLoaded() {
    makeMapsElementsNotFocusable();
    addTitlesToMapsFrames();
}

function makeMapsElementsNotFocusable() {
    const items = [];
    items.push(...document.querySelectorAll('#map [tabindex]'));
    items.push(...document.querySelectorAll('#map iframe'));
    items.push(...document.querySelectorAll('#map a'));
    items.push(...document.querySelectorAll('#map button'));
    items.forEach(function (item) {
        item.setAttribute('tabindex', '-1');
    });
}

function addTitlesToMapsFrames() {
    [...document.querySelectorAll('#map iframe')].forEach(function (item) {
        item.setAttribute('title', 'Google Maps Frame');
    });
}

/**
 * Update page and map for current restaurants.
 */
function updateRestaurants() {
    const cSelect = document.getElementById('cuisines-select');
    const nSelect = document.getElementById('neighborhoods-select');

    const cIndex = cSelect.selectedIndex;
    const nIndex = nSelect.selectedIndex;

    const cuisine = cSelect[cIndex].value;
    const neighborhood = nSelect[nIndex].value;

    DBHelper.fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, (error, restaurants) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            resetRestaurants(restaurants);
            fillRestaurantsHTML();
        }
    });
}

/**
 * Clear current restaurants, their HTML and remove their map markers.
 */
function resetRestaurants(restaurants) {
    // Remove all restaurants
    self.restaurants = [];
    const ul = document.getElementById('restaurants-list');
    ul.innerHTML = '';

    // Remove all map markers
    self.markers.forEach(m => m.setMap(null));
    self.markers = [];
    self.restaurants = restaurants;
}

/**
 * Create all restaurants HTML and add them to the webpage.
 */
function fillRestaurantsHTML(restaurants = self.restaurants) {
    const ul = document.getElementById('restaurants-list');
    restaurants.forEach(restaurant => {
        ul.append(createRestaurantHTML(restaurant));
    });
    addMarkersToMap();
}

function createHtmlPicture(restaurant) {
    const imageJpg = DBHelper.imageUrlForRestaurant(restaurant, 'jpg');
    const imageWebp = DBHelper.imageUrlForRestaurant(restaurant, 'webp');

    const picture = document.createElement('picture');

    const sourceWebp = document.createElement('source');
    sourceWebp.srcset = imageWebp;
    sourceWebp.type = 'image/webp';

    const sourceJpg = document.createElement('source');
    sourceJpg.srcset = imageJpg;
    sourceJpg.type = 'image/jpeg';

    const image = document.createElement('img');
    image.className = 'restaurant-img';
    image.src = imageJpg;
    image.alt = `Image representing the restaurant ${restaurant.name}`;

    picture.append(sourceWebp);
    picture.append(sourceJpg);
    picture.append(image);

    return picture;
}

/**
 * Create restaurant HTML.
 */
function createRestaurantHTML(restaurant) {
    const li = document.createElement('li');

    li.append(createHtmlPicture(restaurant));

    const name = document.createElement('h2');
    name.innerHTML = restaurant.name;
    li.append(name);

    const neighborhood = document.createElement('p');
    neighborhood.innerHTML = restaurant.neighborhood;
    li.append(neighborhood);

    const address = document.createElement('p');
    address.innerHTML = restaurant.address;
    li.append(address);

    const more = document.createElement('a');
    more.innerHTML = 'View Details';
    more.href = DBHelper.urlForRestaurant(restaurant);
    more.setAttribute('aria-label', restaurant.name);
    li.append(more);

    return li;
}

/**
 * Add markers for current restaurants to the map.
 */
function addMarkersToMap(restaurants = self.restaurants) {
    restaurants.forEach(restaurant => {
        // Add marker to the map
        const marker = DBHelper.mapMarkerForRestaurant(restaurant, self.map);
        google.maps.event.addListener(marker, 'click', () => {
            window.location.href = marker.url;
        });
        self.markers.push(marker);
    });
}

if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/service-worker.js')
        .then(function (registration) {
            console.log('Registration successful, scope is:', registration.scope);
        })
        .catch(function (error) {
            console.log('Service worker registration failed, error:', error);
        });
}


/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    let loc = {
        lat: 40.722216,
        lng: -73.987501
    };

    self.map = new google.maps.Map(document.getElementById('map'), {
        zoom: 12,
        center: loc,
        scrollwheel: false
    });

    updateRestaurants();

    // Hack to set the tabIndex after the map really finished loading
    google.maps.event.addListener(self.map, 'tilesloaded', () =>
        setTimeout(() => onMapLoaded(), 1000));
};

window.updateRestaurants = updateRestaurants;