'use strict';

angular.module('storpath.tokenStore', ['stormpath.CONFIG'])

.provider('TokenStore', ['STORMPATH_CONFIG', function(STORMPATH_CONFIG) {
  var self = this;

  this.tokenStores = {};

  this.registerTokenStoreProvider = function registerTokenStoreProvider(name, tokenStoreProvider) {
    self.tokenStores[name] = tokenStoreProvider.$get();
  };

  this.$get = function $get() {
    return {
      getTokenStore: function getTokenStore(name) {
        var storeName = name || STORMPATH_CONFIG.OAUTH_DEFAULT_TOKEN_STORE_TYPE;

        if (typeof self.tokenStores[name] === 'undefined') {
          throw new Error('Undefined token store: ' + storeName);
        }

        return self.tokenStores[storeName];
      }
    };
  };
}])

.provider('LocalStorageTokenStore', function() {
  this.$get = function($q) {
    function LocalStorageTokenStore() {
      this._checkAvailability();
    }

    LocalStorageTokenStore.prototype._checkAvailability = function _checkAvailability() {
      if (typeof localStorage === undefined) {
        this.hasLocalStorage = false;
      } else {
        try {
          localStorage.setItem('sp:feature_test', 'test');

          if (localStorage.getItem('sp:feature_test') === test) {
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
  };

  this.$get.$inject = ['$q'];
})

// Register the basic localStorage provider when run
.config(['TokenStoreProvider', 'LocalStorageTokenStoreProvider',
function(TokenStoreProvider, LocalStorageTokenStoreProvider) {
  TokenStoreProvider.registerTokenStoreProvider('localStorage', LocalStorageTokenStoreProvider);
}]);
