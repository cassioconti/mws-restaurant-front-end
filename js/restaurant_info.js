/*global google*/
const DBHelper = require('./dbhelper');
const idbHelper = require('./idbhelper');
const ToastrHandler = require('./toastr-handler');
const toastrHandler = new ToastrHandler();

/**
 * Initialize Google map, called from HTML.
 */
window.initMap = () => {
    fetchRestaurantFromURL((error, restaurant) => {
        if (error) { // Got an error!
            console.error(error);
        } else {
            self.map = new google.maps.Map(document.getElementById('map'), {
                zoom: 16,
                center: restaurant.latlng,
                scrollwheel: false
            });
            fillBreadcrumb();
            DBHelper.mapMarkerForRestaurant(self.restaurant, self.map);

            // Hack to set the tabIndex after the map really finished loading
            google.maps.event.addListener(self.map, 'tilesloaded', () =>
                setTimeout(() => onMapLoaded(), 1000));
        }
    });
};

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
        item.setAttribute('aria-hidden', true);
    });
}

function addTitlesToMapsFrames() {
    [...document.querySelectorAll('#map iframe')].forEach(function (item) {
        item.setAttribute('title', 'Google Maps Frame');
    });
}

function hookFavoriteButtons(restaurantId, isFavorite) {
    const emptyStar = document.querySelectorAll('div.star.star-no-favorite')[0];
    const filledStar = document.querySelectorAll('div.star.star-favorite')[0];

    const clickEvent = () => {
        emptyStar.classList.toggle('star-hidden');
        filledStar.classList.toggle('star-hidden');
        const isFavorite = emptyStar.classList.contains('star-hidden');
        DBHelper.setFavorite(restaurantId, isFavorite);
        if (isFavorite) {
            filledStar.focus();
        } else {
            emptyStar.focus();
        }
    };

    const keypressEvent = (event) => {
        if (event.key === ' ' || event.key === 'Enter') {
            event.preventDefault();
            clickEvent();
        }
    };

    emptyStar.addEventListener('click', clickEvent);
    filledStar.addEventListener('click', clickEvent);
    emptyStar.addEventListener('keypress', keypressEvent);
    filledStar.addEventListener('keypress', keypressEvent);

    if (isFavorite) {
        filledStar.classList.remove('star-hidden');
    } else {
        emptyStar.classList.remove('star-hidden');
    }
}

function hookReviewForm(restaurantId) {
    const reviewForm = document.getElementById('add-review-form');
    const messageArea = reviewForm.querySelectorAll('textarea')[0];

    messageArea.addEventListener('keyup', () => {
        messageArea.style.height = '20px';
        messageArea.style.height = (messageArea.scrollHeight) + 'px';
    });

    reviewForm.addEventListener('submit', () => submitReviewForm(restaurantId, reviewForm));
}

function submitReviewForm(restaurantId, reviewForm) {
    event.preventDefault();

    const review = {
        id: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        restaurant_id: restaurantId,
        name: reviewForm.elements.name.value,
        rating: reviewForm.elements.rating.value ? parseInt(reviewForm.elements.rating.value) : 0,
        comments: reviewForm.elements.comments.value,
    };

    const ul = document.getElementById('reviews-list');
    ul.insertBefore(createReviewHTML(review), ul.firstChild);

    DBHelper.postReview(restaurantId, review.name, review.rating, review.comments)
        .then(() => toastrHandler.notify('Review added successfully'))
        .catch(() => {
            toastrHandler.notify('Review\'s server is not reachable now. We will automatically keep trying and let you know when we succeed.');
            keepTryingToPost(restaurantId, review.name, review.rating, review.comments);
        });

    idbHelper.addReviews([review]);

    reviewForm.elements.name.value = '';
    reviewForm.elements.rating.value = '';
    reviewForm.elements.comments.value = '';
}

function keepTryingToPost(restaurantId, name, rating, comments) {
    setTimeout(() => {
        DBHelper.postReview(restaurantId, name, rating, comments)
            .then(() => toastrHandler.notify('Review added successfully'))
            .catch(() => keepTryingToPost(restaurantId, name, rating, comments));
    }, 5000);
}

/**
 * Get current restaurant from page URL.
 */
function fetchRestaurantFromURL(callback) {
    if (self.restaurant) { // restaurant already fetched!
        callback(null, self.restaurant);
        return;
    }
    const id = getParameterByName('id');
    if (!id) { // no id found in URL
        const error = 'No restaurant id in URL';
        callback(error, null);
    } else {
        DBHelper.fetchRestaurantById(id, (error, restaurant) => {
            self.restaurant = restaurant;
            if (!restaurant) {
                console.error(error);
                return;
            }
            fillRestaurantHTML();
            callback(null, restaurant);
        });
    }
}

/**
 * Create restaurant HTML and add it to the webpage
 */
function fillRestaurantHTML(restaurant = self.restaurant) {
    const name = document.getElementById('restaurant-name');
    name.innerHTML = restaurant.name;

    const address = document.getElementById('restaurant-address');
    address.innerHTML = restaurant.address;

    const image = document.getElementById('restaurant-img');
    image.className = 'restaurant-img';
    image.src = DBHelper.imageUrlForRestaurant(restaurant, 'jpg');
    image.alt = `Image representing the restaurant ${restaurant.name}`;

    const cuisine = document.getElementById('restaurant-cuisine');
    cuisine.innerHTML = restaurant.cuisine_type;

    // fill operating hours
    if (restaurant.operating_hours) {
        fillRestaurantHoursHTML();
    }

    // fill reviews
    fillReviewsHTML();

    hookFavoriteButtons(restaurant.id, restaurant.is_favorite === 'true');
    hookReviewForm(restaurant.id);
}

/**
 * Create restaurant operating hours HTML table and add it to the webpage.
 */
function fillRestaurantHoursHTML(operatingHours = self.restaurant.operating_hours) {
    const hours = document.getElementById('restaurant-hours');
    for (let key in operatingHours) {
        const row = document.createElement('tr');

        const day = document.createElement('td');
        day.innerHTML = key;
        row.appendChild(day);

        const time = document.createElement('td');
        time.innerHTML = operatingHours[key];
        row.appendChild(time);

        hours.appendChild(row);
    }
}

/**
 * Create all reviews HTML and add them to the webpage.
 */
function fillReviewsHTML(reviews = self.restaurant.reviews) {
    const container = document.getElementById('reviews-container');
    const title = document.createElement('h3');
    title.innerHTML = 'Reviews';
    container.appendChild(title);

    if (!reviews) {
        const noReviews = document.createElement('p');
        noReviews.innerHTML = 'No reviews yet!';
        container.appendChild(noReviews);
        return;
    }
    const ul = document.getElementById('reviews-list');
    reviews.forEach(review => {
        ul.appendChild(createReviewHTML(review));
    });
    container.appendChild(ul);
}

/**
 * Create review HTML and add it to the webpage.
 */
function createReviewHTML(review) {
    const li = document.createElement('li');
    const name = document.createElement('p');
    name.innerHTML = review.name;
    li.appendChild(name);

    const date = document.createElement('p');
    date.innerHTML = new Date(review.updatedAt);
    li.appendChild(date);

    const rating = document.createElement('p');
    rating.innerHTML = `Rating: ${review.rating}`;
    li.appendChild(rating);

    const comments = document.createElement('p');
    comments.innerHTML = review.comments;
    li.appendChild(comments);

    return li;
}

/**
 * Add restaurant name to the breadcrumb navigation menu
 */
function fillBreadcrumb(restaurant = self.restaurant) {
    const breadcrumb = document.getElementById('breadcrumb');
    const li = document.createElement('li');
    li.innerHTML = restaurant.name;
    breadcrumb.appendChild(li);
}

/**
 * Get a parameter by name from page URL.
 */
function getParameterByName(name, url) {
    if (!url)
        url = window.location.href;
    name = name.replace(/[[\]]/g, '\\$&');
    const regex = new RegExp(`[?&]${name}(=([^&#]*)|&|#|$)`),
        results = regex.exec(url);
    if (!results)
        return null;
    if (!results[2])
        return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
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