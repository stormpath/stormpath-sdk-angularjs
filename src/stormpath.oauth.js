'use strict';

function camelCaseProps(obj) {
  var camelCasedObj = {};

  Object.keys(obj).forEach(function(key) {
    if (obj.hasOwnProperty(key)) {
      var camelCasedKey = key.replace(/_([A-Za-z])/g, function(all, char) {
        return char.toUpperCase();
      });

      camelCasedObj[camelCasedKey] = obj[key];
    }
  });

  return camelCasedObj;
}

/**
* @ngdoc overview
*
* @name stormpath.oauth
*
* @description
*
* This module provides the {@link stormpath.oauth.StormpathOAuth StormpathOAuth}
* and {@link stormpath.oauth.StormpathOAuthToken StormpathOAuthToken} services,
* implementing a client-side OAuth2 workflow.
*/
angular.module('stormpath.oauth', ['stormpath.CONFIG', 'storpath.tokenStore'])

/**
* @ngdoc service
*
* @name stormpath.oauth.StormpathOAuthTokenProvider
* @requires stormpath.STORMPATH_CONFIG:STORMPATH_CONFIG
* @description
*
* Provides the {@link stormpath.oauth.StormpathOAuthToken StormpathOAuthToken}
* service.
*/
.provider('StormpathOAuthToken', ['STORMPATH_CONFIG',
function StormpathOAuthTokenProvider(STORMPATH_CONFIG) {
  var self = this;

  this._tokenStoreType = STORMPATH_CONFIG.OAUTH_DEFAULT_TOKEN_STORE_TYPE;

  /**
  * @ngdoc method
  * @name stormpath.oauth.StormpathOAuthTokenProvider#setTokenStoreType
  * @methodOf stormpath.oauth.StormpathOAuthTokenProvider
  *
  * @param {String} tokenStoreType The name of the token store type the tokens should use to record and read their data.
  *
  * @description
  *
  * Sets the name of the token store type that the tokens use to store and load its data.
  * See {@link stormpath.tokenStore.TokenStore#getTokenStore TokenStore.getTokenStore}
  * for details.
  */
  this.setTokenStoreType = function setTokenStoreType(tokenStoreType) {
    this._tokenStoreType = tokenStoreType;
  };

  /**
  * @ngdoc service
  * @name stormpath.oauth.StormpathOAuthToken
  * @requires $q
  * @requires stormpath.tokenStore.TokenStore
  *
  * @description
  *
  * A service for managing OAuth tokens. It offers a simple interface for storing
  * and reading tokens into a generic storage (backed by
  * {@link stormpath.tokenStore.TokenStore}), as well as utility methods for
  * getting specific components of the token - the access token, refresh token,
  * token type, as well as the Authorization header constructed from the token.
  *
  * It uses the token store type set in the provider, unless overrided via
  * {@link stormpath.oauth.StormpathOAuthToken#setTokenStoreType StormpathOAuthToken.setTokenStoreType}.
  */
  this.$get = function $get($q, TokenStore) {
    function StormpathOAuthToken() {
      this.tokenStore = TokenStore.getTokenStore(self._tokenStoreType);
    }

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#setTokenStoreType
    * @methodOf stormpath.oauth.StormpathOAuthToken
    * @param {String} tokenStoreType The name of the token store type this token should use to record and read their data.
    *
    * @description
    *
    * Sets the name of the token store type that this token uses to store and load its data.
    * See {@link stormpath.tokenStore.TokenStore#getTokenStore TokenStore.getTokenStore}
    * for details.
    */
    StormpathOAuthToken.prototype.setTokenStoreType = function setTokenStoreType(tokenStoreType) {
      this.tokenStore = TokenStore.getTokenStore(tokenStoreType);
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#setToken
    * @methodOf stormpath.oauth.StormpathOAuthToken
    * @param {Object} token The OAuth authorization response returned by the API
    * @returns {Promise} A promise that is resolved or rejected when the storage attempt succeeds or fails
    *
    * @description
    *
    * Stores the OAuth token data object into storage, relying on its token store
    * for the storage implementation details. It transforms the snake-cased keys
    * returned from the API into camel-cased keys when storing the token.
    */
    StormpathOAuthToken.prototype.setToken = function setToken(token) {
      var canonicalToken = camelCaseProps(token);
      return this.tokenStore.put(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME, canonicalToken);
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#getToken
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} A promise containing either the resolved token, or a rejection with a reason.
    *
    * @description
    *
    * Retrieves the OAuth token data object from storage, relying on its set token
    * store for the loading implementation details. The result will use camel-cased
    * keys, as noted in
    * {@link stormpath.oauth.StormpathOAuthToken#setToken StormpathOAuthToken.setToken}.
    */
    StormpathOAuthToken.prototype.getToken = function getToken() {
      return this.tokenStore.get(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME);
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#removeToken
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} A promise indicating whether the operation had succeeded
    *
    * @description
    *
    * Removes the OAuth token from storage, relying on its set token store for the
    * implementation details.
    */
    StormpathOAuthToken.prototype.removeToken = function removeToken() {
      return this.tokenStore.remove(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME);
    };

    StormpathOAuthToken.prototype.getAccessToken = function getAccessToken() {
      return this.getToken().then(function(token) {
        return token ? token.accessToken : null;
      });
    };

    StormpathOAuthToken.prototype.getRefreshToken = function getRefreshToken() {
      return this.getToken().then(function(token) {
        return token ? token.refreshToken : null;
      });
    };

    StormpathOAuthToken.prototype.getTokenType = function getTokenType() {
      return this.getToken().then(function(token) {
        return token ? token.tokenType : null;
      });
    };

    StormpathOAuthToken.prototype.getAuthorizationHeader = function getAuthorizationHeader() {
      return $q
      .all([this.getTokenType(), this.getAccessToken()])
      .then(function(tokenData) {
        var tokenType = tokenData[0];
        var accessToken = tokenData[1];

        if (!tokenType || !accessToken) {
          return;
        }

        console.log(tokenType, accessToken);
        var tokenTypeName = tokenType.charAt(0).toUpperCase() + tokenType.substr(1);

        return tokenTypeName + ' ' + accessToken;
      });
    };

    return new StormpathOAuthToken();
  };

  this.$get.$inject = ['$q', 'TokenStore'];
}])

.provider('StormpathOAuth', ['STORMPATH_CONFIG', function StormpathOAuthProvider(STORMPATH_CONFIG) {
  this.$get = function($http, StormpathOAuthToken) {
    function StormpathOAuth() {}

    StormpathOAuth.prototype.authenticate = function authenticate(requestData, opts) {
      var data = angular.extend({
        grant_type: 'password'
      }, requestData);

      var options = angular.extend({
        headers: {
          Authorization: undefined
        }
      }, opts);

      return $http.post(STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'), data, options)
        .then(function(response) {
          StormpathOAuthToken.setToken(response.data);

          return response;
        });
    };

    StormpathOAuth.prototype.revoke = function revoke(requestData, opts) {
      return StormpathOAuthToken.getToken().then(function(token) {
        var data = angular.extend({
          token: token.refreshToken || token.accessToken,
          token_type_hint: token.refreshToken ? 'refresh_token' : 'access_token'
        }, requestData);

        var options = angular.extend({}, opts);

        return $http.post(STORMPATH_CONFIG.getUrl('OAUTH_REVOKE_ENDPOINT'), data, options)
          .then(function(response) {
            StormpathOAuthToken.removeToken();

            return response;
          });
      });
    };

    StormpathOAuth.prototype.refresh = function(requestData, opts) {
      return StormpathOAuthToken.getRefreshToken().then(function(refreshToken) {
        var data = angular.extend({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }, requestData);

        var options = angular.extend({
          headers: {
            Authorization: undefined
          }
        }, opts);

        return $http.post(STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'), data, options)
          .then(function(response) {
            StormpathOAuthToken.setToken(response.data);

            return response;
          });
      });
    };

    return new StormpathOAuth();
  };

  this.$get.$inject = ['$http', 'StormpathOAuthToken'];
}]);
