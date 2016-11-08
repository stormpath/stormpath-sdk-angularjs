'use strict';

/**
* @ngdoc overview
*
* @name stormpath.tokenStore
*
* @description
*
* This module provides a global access point for registering and fetching token
* store mechanisms, as employed by the {@link stormpath.oauth} module.
*/

/**
* @ngdoc object
* @interface stormpath.tokenStore.TokenStore
*
* @description
* A token store implementation. It allows simple key-value pair storing, fetching,
* and deleting. Its methods may be synchronous, but must always return promises.
*/

/**
* @ngdoc method
* @name stormpath.tokenStore.TokenStore#put
* @methodOf stormpath.tokenStore.TokenStore
*
* @param {String} name The name under which to store a value.
* @param {Any} value The string representation of a value.
* @returns {Promise} Indication of success
*
* @description
*
* Stores a string value in a key-value store.
*/

/**
* @ngdoc method
* @name stormpath.tokenStore.TokenStore#get
* @methodOf stormpath.tokenStore.TokenStore
*
* @param {String} name The name for which to retrieve a value.
* @returns {Promise} The resolved value retrieved from the store, or a rejection with a reason.
*
* @description
*
* Retrieves a value from a key-value store.
*/

/**
* @ngdoc method
* @name stormpath.tokenStore.TokenStore#remove
* @methodOf stormpath.tokenStore.TokenStore
*
* @param {String} name The name for which to remove a value.
* @returns {Promise} Indication of success. Should resolve if there is no value to remove.
*
* @description
*
* Remove a value from a key-value store.
*/

angular.module('storpath.tokenStore', ['stormpath.CONFIG'])

/**
* @ngdoc service
*
* @name stormpath.tokenStore.TokenStoreManagerProvider
*
* @description
*
* Provides the {@link stormpath.tokenStore.TokenStoreManager TokenStoreManager} service.
*/
.provider('TokenStoreManager', function() {
  var tokenStores = {};

  /**
  * @ngdoc object
  *
  * @name stormpath.tokenStore.TokenStoreManager
  *
  * @description
  *
  * This service provides methods for registering token stores (with duck-typed
  * validation), as well as retrieving them by name.
  *
  * Token store implementations must implement the
  * {@link stormpath.tokenStore.TokenStore TokenStore interface}.
  *
  * All token stores are expected to satisfy the following contract:
  *   - Instances must have a `put` method that takes a key and a value, stores them, and returns a promise indicating success
  *   - Instances must have a `get` method that takes a key and returns a promise containing the value for the given key, or a rejection with a reason
  *   - Instances must have a `remove` method that takes a key and removes the value, returning the result as a promise
  *
  * See {@link stormpath.tokenStore.LocalStorageTokenStore LocalStorageTokenStore}
  * for an example of an implementation.
  *
  * @example
  *
  * <pre>
  *   angular.module('app')
  *     .run(['$q', 'TokenStoreManager', function($q, TokenStoreManager) {
  *       // Can also be provided by a service/factory for better code organisation
  *       var myStore = {
  *         data: {},
  *         get: function get(key) {
  *           return this.data[key] ? $q.resolve(this.data[key]) : $q.reject();
  *         },
  *         put: function put(key, value) {
  *           this.data[key] = value;
  *           return $q.resolve();
  *         },
  *         remove: function remove(key) {
  *           delete this.data[key];
  *           return $q.resolve();
  *         }
  *       };
  *
  *       TokenStoreManager.registerTokenStore('basicStore', myStore);
  *
  *       var alsoMyStore = TokenStoreManager.getTokenStore('basicStore');
  *     }]);
  * </pre>
  */
  this.$get = function $get() {
    return {
      /**
      * @ngdoc method
      * @name stormpath.tokenStore.TokenStoreManager#registerTokenStore
      *
      * @methodOf stormpath.tokenStore.TokenStoreManager
      *
      * @param {String} name The name under which to store the token store implementation
      * @param {TokenStore} tokenStore A concrete {@link stormpath.tokenStore.TokenStore TokenStore}
      *
      * @throws {Error} tokenStore must satisfy the token store contract methods (get, put, remove).
      */
      registerTokenStore: function registerTokenStore(name, tokenStore) {
        var requiredMethods = ['get', 'put', 'remove'];

        var isValid = tokenStore && requiredMethods.reduce(function(valid, method) {
          return valid && angular.isFunction(tokenStore[method]);
        }, true);

        if (!isValid) {
          throw new Error('Invalid token store. `get`, `put` and `remove` methods must be supported');
        }

        tokenStores[name] = tokenStore;
      },
      /**
      * @ngdoc method
      * @name stormpath.tokenStore.TokenStoreManager#getTokenStore
      *
      * @methodOf stormpath.tokenStore.TokenStoreManager
      *
      * @param {String} name The name of the token store implementation.
      * @returns {TokenStore} The token store implementation stored under that name
      * @throws {Error} When no token store is present for that name.
      */
      getTokenStore: function getTokenStore(name) {
        if (angular.isUndefined(tokenStores[name])) {
          throw new Error('Unrecognised token store: ' + name);
        }

        return tokenStores[name];
      }
    };
  };
})

/**
* @ngdoc service
* @name stormpath.tokenStore.LocalStorageTokenStore
* @augments stormpath.tokenStore.TokenStore
*
* @description
*
* Implements token storage via browser localStorage.
*/
.factory('LocalStorageTokenStore', ['$q', function($q) {
  function LocalStorageTokenStore() {
    this._checkAvailability();
  }

  // Checks whether the current environment supports localStorage and sets the
  // internal state accordingly
  LocalStorageTokenStore.prototype._checkAvailability = function _checkAvailability() {
    if (typeof localStorage === undefined) {
      this.hasLocalStorage = false;
    } else {
      try {
        localStorage.setItem('sp:feature_test', 'test');

        if (localStorage.getItem('sp:feature_test') === 'test') {
          localStorage.removeItem('sp:feature_test');
          this.hasLocalStorage = true;
        } else {
          this.hasLocalStorage = false;
        }
      } catch (e) {
        this.hasLocalStorage = false;
      }
    }
  };

  // Provides uniform rejection method for when localStorage is not supported
  LocalStorageTokenStore.prototype._reject = function _reject() {
    return $q.reject({
      error: {
        message: 'Local storage not supported'
      }
    });
  };

  /**
  * @ngdoc method
  * @name stormpath.tokenStore.LocalStorageTokenStore#put
  * @methodOf stormpath.tokenStore.LocalStorageTokenStore
  *
  * @param {String} name The name under which to store a value.
  * @param {Any} value The string representation of a value.
  * @returns {Promise} Indication of success
  *
  * @description
  *
  * Attempts to store a key-value pair using the localStorage API.
  */
  LocalStorageTokenStore.prototype.put = function put(key, value) {
    if (!this.hasLocalStorage) {
      return this._reject();
    }

    var stringValue;

    try {
      stringValue = JSON.stringify(value);
    } catch (e) {
      console.error(value);
      console.error(e);
      $q.reject(e);
    }

    localStorage.setItem(key, stringValue);
    return $q.resolve();
  };

  /**
  * @ngdoc method
  * @name stormpath.tokenStore.LocalStorageTokenStore#get
  * @methodOf stormpath.tokenStore.LocalStorageTokenStore
  *
  * @param {String} name The name for which to retrieve a value.
  * @returns {Promise} Resolved with value or rejected if local storage is unsupported, or value not present.
  *
  * @description
  *
  * Attempts to retrieve a value for a given key using the localStorage API.
  */
  LocalStorageTokenStore.prototype.get = function get(key) {
    if (!this.hasLocalStorage) {
      return this._reject();
    }

    var value = localStorage.getItem(key);

    if (angular.isDefined(value)) {
      try {
        return $q.resolve(JSON.parse(value));
      } catch (e) {
        return $q.reject(e);
      }
    }

    return $q.reject();
  };

  /**
  * @ngdoc method
  * @name stormpath.tokenStore.LocalStorageTokenStore#remove
  * @methodOf stormpath.tokenStore.LocalStorageTokenStore
  *
  * @param {String} name The name for which to remove the value.
  * @returns {Promise} Indication of success
  *
  * @description
  *
  * Attempts to remove a value for a key from store using the localStorage API.
  */
  LocalStorageTokenStore.prototype.remove = function remove(key) {
    if (!this.hasLocalStorage) {
      return this._reject();
    }

    localStorage.removeItem(key);
    return $q.resolve();
  };

  return new LocalStorageTokenStore();
}])

// Register the basic localStorage provider when run
.run(['TokenStoreManager', 'LocalStorageTokenStore',
function(TokenStoreManager, LocalStorageTokenStore) {
  TokenStoreManager.registerTokenStore('localStorage', LocalStorageTokenStore);
}]);
