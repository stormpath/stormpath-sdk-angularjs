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
* @interface stormpath.tokenStore.TokenStoreImpl
*
* @description
* A token store implementation. It allows simple key-value pair storing, fetching,
* and deleting. Its methods may be synchronous, but must always return promises.
*/

/**
* @ngdoc method
* @name stormpath.tokenStore.TokenStoreImpl#put
* @methodOf stormpath.tokenStore.TokenStoreImpl
*
* @param {String} name The name under which to store a value.
* @param {String} value The string representation of a value.
* @returns {Promise} Indication of success
*
* @description
*
* Stores a string value in a key-value store.
*/

/**
* @ngdoc method
* @name stormpath.tokenStore.TokenStoreImpl#get
* @methodOf stormpath.tokenStore.TokenStoreImpl
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
* @name stormpath.tokenStore.TokenStoreImpl#remove
* @methodOf stormpath.tokenStore.TokenStoreImpl
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
* @name stormpath.tokenStore.TokenStoreProvider
*
* @description
*
* Provides the {@link stormpath.tokenStore.TokenStore TokenStore} service.
*/
.provider('TokenStore', function() {
  var tokenStores = {};

  /**
  * @ngdoc object
  *
  * @name stormpath.tokenStore.TokenStore
  *
  * @description
  *
  * This service provides methods for registering token stores (with duck-typed
  * validation), as well as retrieving them by name.
  *
  * Token store implementations must implement the
  * {@link stormpath.tokenStore.TokenStoreImpl TokenStoreImpl interface}.
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
  *     .run(['$q', 'TokenStore', function($q, TokenStore) {
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
  *       TokenStore.registerTokenStore('basicStore', myStore);
  *
  *       var alsoMyStore = TokenStore.getTokenStore('basicStore');
  *     }]);
  * </pre>
  */
  this.$get = function $get() {
    return {
      /**
      * @ngdoc method
      * @name stormpath.tokenStore.TokenStore#registerTokenStore
      *
      * @methodOf stormpath.tokenStore.TokenStore
      *
      * @param {String} name The name under which to store the token store implementation
      * @param {TokenStoreImpl} tokenStore A concrete {@link stormpath.tokenStore.TokenStoreImpl TokenStoreImpl}
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
      * @name stormpath.tokenStore.TokenStore#getTokenStore
      *
      * @methodOf stormpath.tokenStore.TokenStore
      *
      * @param {String} name The name of the token store implementation.
      * @returns {TokenStoreImpl} The token store implementation stored under that name
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

.factory('LocalStorageTokenStore', ['$q', function($q) {
  function LocalStorageTokenStore() {
    this._checkAvailability();
  }

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

  LocalStorageTokenStore.prototype._reject = function _reject() {
    return $q.reject({
      error: {
        message: 'Local storage not supported'
      }
    });
  };

  LocalStorageTokenStore.prototype.put = function put(key, value) {
    if (!this.hasLocalStorage) {
      return this._reject();
    }

    localStorage.setItem(key, value);
    return $q.resolve();
  };

  LocalStorageTokenStore.prototype.get = function get(key) {
    if (!this.hasLocalStorage) {
      return this._reject();
    }

    return $q.resolve(localStorage.getItem(key));
  };

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
.run(['TokenStore', 'LocalStorageTokenStore',
function(TokenStore, LocalStorageTokenStore) {
  TokenStore.registerTokenStore('localStorage', LocalStorageTokenStore);
}]);
