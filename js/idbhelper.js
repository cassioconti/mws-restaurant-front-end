const idb = require('idb');

/** Handles the IDB */
class IdbHelper {
    constructor() {
        this._dbPromise = idb.open('restaurant', 1, function (upgradeDb) {
            var store = upgradeDb.createObjectStore('restaurants', {
                keyPath: 'id'
            });
        });
    }

    addRestaurants(restaurants) {
        return this._dbPromise.then(function (db) {
            if (!db) return;

            var tx = db.transaction('restaurants', 'readwrite');
            var store = tx.objectStore('restaurants');
            restaurants.forEach(function (restaurant) {
                store.put(restaurant);
            });
        });
    }

    getAllRestaurants() {
        return this._dbPromise.then(db => {
            return db.transaction('restaurants')
                .objectStore('restaurants').getAll();
        });
    }

    getRestaurant(id) {
        return this._dbPromise.then(db => {
            return db.transaction('restaurants')
                .objectStore('restaurants').get(id);
        });
    }
}

if (!IdbHelper.idbHelper) {
    IdbHelper.idbHelper = new IdbHelper();
}

/** Exposes the IDB handler for restaurants */
module.exports = IdbHelper.idbHelper;