const idb = require('idb');

/** Handles the IDB */
class IdbHelper {
    constructor() {
        this._dbPromiseRestaurant = idb.open('restaurant', 1, function (upgradeDb) {
            upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
        });

        this._dbPromiseReview = idb.open('review', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('reviews', {
                keyPath: 'id'
            });
            store.createIndex('restaurant_id', 'restaurant_id');
        });
    }

    addRestaurants(restaurants) {
        return this._dbPromiseRestaurant.then(function (db) {
            if (!db) return;

            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
                store.put(restaurant);
            });
        });
    }

    getAllRestaurants() {
        return this._dbPromiseRestaurant.then(db => {
            return db.transaction('restaurants')
                .objectStore('restaurants').getAll();
        });
    }

    getRestaurant(id) {
        return this._dbPromiseRestaurant.then(db => {
            return db.transaction('restaurants')
                .objectStore('restaurants').get(id);
        });
    }

    addReviews(reviews) {
        return this._dbPromiseReview.then(function (db) {
            if (!db) return;

            var tx = db.transaction('reviews', 'readwrite');
            var store = tx.objectStore('reviews');
            reviews.forEach(function (review) {
                store.put(review);
            });
        });
    }

    getAllReviewsForRestaurant(restaurantId) {
        return this._dbPromiseReview.then(db => {
            return db.transaction('reviews')
                .objectStore('reviews')
                .index('restaurant_id')
                .getAll(restaurantId);
        });
    }
}

if (!IdbHelper.idbHelper) {
    IdbHelper.idbHelper = new IdbHelper();
}

/** Exposes the IDB handler for restaurants */
module.exports = IdbHelper.idbHelper;