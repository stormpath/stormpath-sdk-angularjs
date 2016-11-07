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
      * @param {Object} tokenStore
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
      getTokenStore: function getTokenStore(name) {
        if (angular.isUndefined(tokenStores[name])) {
          throw new Error('Undefined token store: ' + name);
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
