'use strict';

angular.module('storpath.tokenStore', ['stormpath.CONFIG'])

.provider('TokenStore', function() {
  var tokenStores = {};

  this.$get = function $get() {
    return {
      registerTokenStore: function registerTokenStore(name, tokenStore) {
        tokenStores[name] = tokenStore;
      },
      getTokenStore: function getTokenStore(name) {
        if (typeof tokenStores[name] === 'undefined') {
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
