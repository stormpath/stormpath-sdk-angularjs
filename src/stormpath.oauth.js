'use strict';

angular.module('stormpath.oauth', ['stormpath.CONFIG', 'storpath.tokenStore'])

.provider('StormpathOAuthToken', ['STORMPATH_CONFIG',
function StormpathOAuthTokenProvider(STORMPATH_CONFIG) {
  var self = this;

  this.tokenStoreType = STORMPATH_CONFIG.OAUTH_DEFAULT_TOKEN_STORE_TYPE;

  this.setTokenStoreType = function setTokenStoreType(type) {
    this.tokenStoreType = type;
  };

  this.$get = function $get($q, TokenStore) {
    function StormpathOAuthToken() {
      this.tokenStore = TokenStore.getTokenStore(self.tokenStoreType);
    }

    StormpathOAuthToken.prototype.setTokenStoreType = function setTokenStoreType(tokenStoreType) {
      this.tokenStore = TokenStore.getTokenStore(tokenStoreType);
    };

    StormpathOAuthToken.prototype.setToken = function setToken(token) {
      return this.tokenStore.put(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME, token);
    };

    StormpathOAuthToken.prototype.getToken = function getToken() {
      return this.tokenStore.get(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME);
    };

    StormpathOAuthToken.prototype.removeToken = function removeToken() {
      return this.tokenStore.remove(STORMPATH_CONFIG.OAUTH_TOKEN_STORAGE_NAME);
    };

    StormpathOAuthToken.prototype.getAccessToken = function getAccessToken() {
      return this.getToken().then(function(token) {
        return token.accessToken;
      });
    };

    StormpathOAuthToken.prototype.getRefreshToken = function getRefreshToken() {
      return this.getToken().then(function(token) {
        return token.refreshToken;
      });
    };

    StormpathOAuthToken.prototype.getTokenType = function getTokenType() {
      return this.getToken().then(function(token) {
        return token.tokenType;
      });
    };

    StormpathOAuthToken.prototype.getAuthorizationHeader = function getAuthorizationHeader() {
      $q
      .all([this.getTokenType.bind(this), this.getAccessToken.bind(this)])
      .then(function(tokenData) {
        var tokenType = tokenData[0];
        var accessToken = tokenData[1];

        if (!tokenType || !accessToken) {
          return;
        }

        return this.getTokenType.charAt(0).toUpperCase()
             + this.getTokenType().substr(1)
             + ' '
             + accessToken;
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
        Authorization: undefined
      }, opts);

      return $http.post(STORMPATH_CONFIG.OAUTH_AUTHENTICATION_ENDPOINT, data, options)
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

        return $http.post(STORMPATH_CONFIG.OAUTH_REVOKE_ENDPOINT, data, options)
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
          Authorization: undefined
        }, opts);

        return $http.post(STORMPATH_CONFIG.OAUTH_AUTHENTICATION_ENDPOINT, data, options)
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
