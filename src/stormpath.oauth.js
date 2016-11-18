'use strict';

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
angular.module('stormpath.oauth', ['stormpath.CONFIG', 'stormpath.utils', 'storpath.tokenStore'])

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
  * See {@link stormpath.tokenStore.TokenStoreManager#getTokenStore TokenStoreManager.getTokenStore}
  * for details.
  */
  this.setTokenStoreType = function setTokenStoreType(tokenStoreType) {
    this._tokenStoreType = tokenStoreType;
  };

  /**
  * @ngdoc service
  * @name stormpath.oauth.StormpathOAuthToken
  * @requires $q
  * @requires stormpath.tokenStore.TokenStoreManager
  *
  * @description
  *
  * A service for managing OAuth tokens. It offers a simple interface for storing
  * and reading tokens into a generic storage (backed by
  * {@link stormpath.tokenStore.TokenStoreManager TokenStoreManager}), as well
  * as utility methods for getting specific components of the token - the access
  * token, refresh token, token type, as well as the Authorization header
  * constructed from the token.
  *
  * It uses the token store type set in the provider, unless overrided via
  * {@link stormpath.oauth.StormpathOAuthToken#setTokenStoreType StormpathOAuthToken.setTokenStoreType}.
  */
  this.$get = function $get($q, $normalizeObjectKeys, TokenStoreManager) {
    function StormpathOAuthToken() {
      this.tokenStore = TokenStoreManager.getTokenStore(self._tokenStoreType);
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
    * See {@link stormpath.tokenStore.TokenStoreManager#getTokenStore TokenStoreManager.getTokenStore}
    * for details.
    */
    StormpathOAuthToken.prototype.setTokenStoreType = function setTokenStoreType(tokenStoreType) {
      this.tokenStore = TokenStoreManager.getTokenStore(tokenStoreType);
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
      var canonicalToken = $normalizeObjectKeys(token);
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

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#getAccessToken
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} Promise containing the access token, or a rejection in case of failure
    *
    * @description
    *
    * Retrieves the access token from storage, relying on the token store for implementation.
    * In case there of storage failure or there being no access token, the result is instead
    * a rejected promise.
    */
    StormpathOAuthToken.prototype.getAccessToken = function getAccessToken() {
      return this.getToken().then(function(token) {
        if (token) {
          return token.accessToken;
        }

        return $q.reject();
      });
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#getRefreshToken
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} Promise containing the refresh token, or a rejection in case of failure
    *
    * @description
    *
    * Retrieves the refresh token from storage, relying on the token store for implementation.
    * In case there of storage failure or there being no refresh token, the result is instead
    * a rejected promise.
    */
    StormpathOAuthToken.prototype.getRefreshToken = function getRefreshToken() {
      return this.getToken().then(function(token) {
        if (token) {
          return token.refreshToken;
        }

        return $q.reject();
      });
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#getTokenType
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} Promise containing the token type, or a rejection in case of failure
    *
    * @description
    *
    * Retrieves the token type from storage, relying on the token store for implementation.
    * In case there of storage failure or there being no token type, the result is instead
    * a rejected promise.
    */
    StormpathOAuthToken.prototype.getTokenType = function getTokenType() {
      return this.getToken().then(function(token) {
        if (token) {
          return token.tokenType;
        }

        return $q.reject();
      });
    };

    /**
    * @ngdoc method
    * @name stormpath.oauth.StormpathOAuthToken#getAuthorizationHeader
    * @methodOf stormpath.oauth.StormpathOAuthToken
    *
    * @returns {Promise} Promise containing the value for the HTTP authorization header, or a rejection
    *
    * @description
    *
    * Constructs a proper HTTP authorization header value for the token in storage. If there is no
    * token currently stored, or an error happens while communicating with the token storage, a rejected
    * promise is returned instead.
    */
    StormpathOAuthToken.prototype.getAuthorizationHeader = function getAuthorizationHeader() {
      return this.getToken()
      .then(function(token) {
        var tokenType = token && token.tokenType;
        var accessToken = token && token.accessToken;

        if (!tokenType || !accessToken) {
          return $q.reject();
        }

        var tokenTypeName = tokenType.charAt(0).toUpperCase() + tokenType.substr(1);

        return tokenTypeName + ' ' + accessToken;
      });
    };

    return new StormpathOAuthToken();
  };

  this.$get.$inject = ['$q', '$normalizeObjectKeys', 'TokenStoreManager'];
}])

/**
* @ngdoc service
*
* @name stormpath.oauth.StormpathOAuthProvider
* @requires stormpath.STORMPATH_CONFIG:STORMPATH_CONFIG
* @description
*
* Provides the {@link stormpath.oauth.StormpathOAuth StormpathOAuth}
* service.
*/
.provider('StormpathOAuth', ['STORMPATH_CONFIG', function StormpathOAuthProvider(STORMPATH_CONFIG) {

  var oauthInstance;

  /**
  * @ngdoc service
  * @name stormpath.oauth.StormpathOAuth
  * @requires $q
  * @requires stormpath.oauth.StormpathOAuthToken
  *
  * @description
  *
  * A service for managing the OAuth client-side authentication flow logic. It
  * offers methods for authenticating via the `password` grant type, refreshing
  * access tokens via refresh tokens, and revoking the current token.
  */
  this.$get = function($http, $spFormEncoder, StormpathOAuthToken) {
    function StormpathOAuth() {}

    /**
    * @ngdoc method
    * @methodOf stormpath.oauth.StormpathOAuth
    * @name #authenticate
    *
    *
    * @param {Object} requestData Authentication data object. Expects an email/username and a password field.
    * @param {Object=} opts Additional request options, (e.g. headers), optional.
    *
    * @returns {Promise} A promise containing the authentication response
    *
    * @description
    *
    * Attempts to authenticate the user, using the password grant flow by default,
    * although the method can be overriden via the `requestOpts` parameter. If
    * successful, automatically stores the token using
    * {@link stormpath.oauth.StormpathOAuthToken#setToken StormpathOAuthToken.setToken}.
    */
    StormpathOAuth.prototype.authenticate = function authenticate(requestData, extraHeaders) {
      var self = this;
      var data = angular.extend({
        grant_type: 'password'
      }, requestData);

      var headers = angular.extend({
        Accept: 'application/json'
      }, extraHeaders);

      return $http($spFormEncoder.formPost({
        url: STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'),
        method: 'POST',
        headers: headers,
        data: data
      })).then(function(response) {
        self.attemptedRefresh = false;
        StormpathOAuthToken.setToken(response.data);

        return response;
      });
    };

    /**
    * @ngdoc method
    * @methodOf stormpath.oauth.StormpathOAuth
    * @name revoke
    *
    * @param {Object=} requestData Additional data to send with the revoke request, optional.
    * @param {Object=} opts Additional request options, (e.g. headers), optional.
    *
    * @returns {Promise} A promise containing the revokation response
    *
    * @description
    *
    * Attempts to revoke the currently active token. If successful, also removes
    * the token from storage, using
    * {@link stormpath.oauth.StormpathOAuthToken#removeToken StormpathOAuthToken.removeToken}.
    */
    StormpathOAuth.prototype.revoke = function revoke() {
      var self = this;

      return StormpathOAuthToken.getToken().then(function(token) {
        var data = {
          token: token.refreshToken || token.accessToken,
          token_type_hint: token.refreshToken ? 'refresh_token' : 'access_token'
        };

        return $http($spFormEncoder.formPost({
          url: STORMPATH_CONFIG.getUrl('OAUTH_REVOKE_ENDPOINT'),
          method: 'POST',
          data: data
        })).finally(function(response) {
          StormpathOAuthToken.removeToken();
          self.attemptedRefresh = false;
          return response;
        });
      });
    };

    /**
     * @ngdoc method
    * @methodOf stormpath.oauth.StormpathOAuth
    * @name refresh
    *
    * @param {Object=} requestData Additional data to add to the refresh POST request, optional.
    * @param {Object=} opts Additional request options, (e.g. headers), optional.
    *
    * @returns {Promise} A promise containing the refresh attempt response
    *
    * @description
    *
    * Attempts to refresh the current token, using its refresh token. If successful,
    * updates the currently stored token using
    * {@link stormpath.oauth.StormpathOAuthToken#setToken StormpathOAuthToken.setToken}
    * with the response data.
    */
    StormpathOAuth.prototype.refresh = function(requestData, extraHeaders) {
      var self = this;

      return StormpathOAuthToken.getRefreshToken().then(function(refreshToken) {
        var data = angular.extend({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }, requestData);

        var headers = angular.extend({
          Accept: 'application/json'
        }, extraHeaders);

        self.attemptedRefresh = true;

        return $http($spFormEncoder.formPost({
          url: STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'),
          method: 'POST',
          headers: headers,
          data: data
        })).then(function(response) {
          StormpathOAuthToken.setToken(response.data);
          self.attemptedRefresh = false;

          return response;
        });
      });
    };

    if (!oauthInstance) {
      oauthInstance = new StormpathOAuth();
    }

    return oauthInstance;
  };

  this.$get.$inject = ['$http', '$spFormEncoder', 'StormpathOAuthToken'];
}])
/**
* @ngdoc service
* @name stormpath.utils.StormpathOAuthInterceptor
*
* @description
*
* Processes requests and response errors to avoid manual OAuth flow integration.
* Adds property Authorization headers to outgoing requests to external domains
* and handles specific OAuth-based response errors.
*/
.factory('StormpathOAuthInterceptor', ['$isCurrentDomain', '$rootScope', '$q', '$injector', 'StormpathOAuthToken', 'STORMPATH_CONFIG',
function($isCurrentDomain, $rootScope, $q, $injector, StormpathOAuthToken, STORMPATH_CONFIG) {

  function StormpathOAuthInterceptor() {}

  /**
  * @ngdoc method
  * @name stormpath.utils.StormpathOAuthInterceptor#request
  * @methodOf stormpath.utils.StormpathOAuthInterceptor
  *
  * @param {Object} config $http config object.
  * @return {Promise} config Promise containing $http config object.
  *
  * @description
  *
  * Adds the Authorization header on all outgoing request that are going to a
  * different domain, do not already have an Authorization header, and only if
  * there is currently a token in the token store.
  */

  /**
   * TODO - make nice and available for developer extension of `testArray`
   *
   */
  function isBlacklisted(url) {
    url = url || '';
    var matched = false;
    var testArray = [
      '/oauth/token$',
      '/oauth/revoke$',
      '/login$',
      '/register$',
    ];
    testArray.forEach(function (expr){
      if (matched) {
        return;
      }
      matched = new RegExp(expr).test(url);
    });
    return matched;
  }

  StormpathOAuthInterceptor.prototype.request = function request(config) {
    if ($isCurrentDomain(config.url) || isBlacklisted(config.url)) {
      return config;
    }

    config.headers = config.headers || {};

    return StormpathOAuthToken.getAuthorizationHeader().then(function(authHeader) {
      if (authHeader) {
        config.headers.Authorization = authHeader;
      }

      return config;
    }).catch(function() {
      return config;
    });
  };

  /**
  * @ngdoc method
  * @name stormpath.utils.StormpathOAuthInterceptor#responseError
  * @methodOf stormpath.utils.StormpathOAuthInterceptor
  *
  * @param {Object} response $http response error object.
  * @return {Promise} Promise containing either the error or the result of a retry after refreshing the OAuth token
  *
  * @description
  *
  * Handles basic OAuth errors. In case of a token expiration, it will try to
  * refresh it. In case of invalid request or token format, it will remove the
  * token instead. Finally, in all cases where a fallback process cannot be made
  * successfully, an {@link OAUTH_REQUEST_ERROR} event is broadcast.
  */
  StormpathOAuthInterceptor.prototype.responseError = function responseError(response) {
    var error = response.data ? response.data.error : null;

    // Ensures that the token is removed in case of invalid_grant or invalid_request
    // responses
    if (response.status === 400 && (error === 'invalid_grant' || error === 'invalid_request')) {
      StormpathOAuthToken.removeToken();

      $rootScope.$broadcast(STORMPATH_CONFIG.OAUTH_REQUEST_ERROR, response);
    }

    // Does not remove the token so that it can be refreshed in the handler,
    // retrying the request instead after refreshing the access token.
    // Gives up if a refresh fails.
    if (response.status === 401 && (error === 'invalid_token' || error === 'invalid_client')) {
      var StormpathOAuth = $injector.get('StormpathOAuth');

      if (!StormpathOAuth.attemptedRefresh) {
        return StormpathOAuth.refresh().then(function() {
          var $http = $injector.get('$http');
          return $http(response.config);
        }).catch(function() {
          $rootScope.$broadcast(STORMPATH_CONFIG.OAUTH_REQUEST_ERROR, response);
          $q.reject(response);
        });
      }

      $rootScope.$broadcast(STORMPATH_CONFIG.OAUTH_REQUEST_ERROR, response);
    }

    return $q.reject(response);
  };

  return new StormpathOAuthInterceptor();
}])
.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('StormpathOAuthInterceptor');
}]);
