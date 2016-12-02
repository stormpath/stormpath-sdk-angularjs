(function() {
  'use strict';

/**
 * @ngdoc overview
 *
 * @name  stormpath.socialLoginService
 *
 * @description
 *
 * This module provides the {@link stormpath.socialLoginService.$socialLogin $socialLogin} service.
 *
 * Currently, this provider does not have any configuration methods.
 */

 /**
  * @ngdoc object
  *
  * @name stormpath.socialLoginService.$socialLogin
  *
  * @description
  *
  * The social login service provides a generic authorization interface through
  * the Stormpath social login interface.
  */
  function SocialLoginService(STORMPATH_CONFIG, $encodeQueryParams, $getLocalUrl, $http, $window) {
    this.providersPromise = null;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
    this.$encodeQueryParams = $encodeQueryParams;
    this.$getLocalUrl = $getLocalUrl;
    this.$http = $http;
    this.$window = $window;
  }

  /**
  * @ngdoc method
  *
  * @name authorize
  * @methodOf stormpath.socialLoginService.$socialLogin
  * @description
  *
  * Authorizes the user using a social authentication provider. This method starts
  * the redirect flow that attempts to authenticate the user, and, if successful,
  * ends in the redirect uri configured via {@link STORMPATH_CONFIG.SOCIAL_LOGIN_REDIRECT_URI}.
  *
  * @param {String} accountStoreHref
  * The HREF of the account store (directory) that is set up to provide the social
  * authentication service.
  *
  * @param {Object} options
  * Additional options (query parameters) to send with the authentication request.
  *
  */
  SocialLoginService.prototype.authorize = function(accountStoreHref, options) {
    var requestParams = angular.extend({
      response_type: this.STORMPATH_CONFIG.SOCIAL_LOGIN_RESPONSE_TYPE,
      account_store_href: accountStoreHref,
      redirect_uri: this.$getLocalUrl(this.STORMPATH_CONFIG.SOCIAL_LOGIN_REDIRECT_URI)
    }, options);

    var queryParams = this.$encodeQueryParams(requestParams);
    var socialAuthUri = this.STORMPATH_CONFIG.getUrl('SOCIAL_LOGIN_AUTHORIZE_URI')
                      + queryParams;

    this.$window.location = socialAuthUri;
  };

  angular.module('stormpath.socialLogin', ['stormpath.CONFIG', 'stormpath.utils'])

  /**
   * @ngdoc object
   *
   * @name stormpath.socialLoginService.$socialLoginProvider
   *
   * @description
   *
   * Provides the {@link stormpath.socialLoginService.$socialLogin $socialLogin} service.
   *
   * Currently, this provider does not have any configuration methods.
   */
  .config(['$injector', 'STORMPATH_CONFIG', function $socialLoginProvider($injector, STORMPATH_CONFIG) {
    var socialLoginFactory = ['$encodeQueryParams', '$http', '$window', '$getLocalUrl', function socialLoginFactory($encodeQueryParams, $http, $window, $getLocalUrl) {
      return new SocialLoginService(STORMPATH_CONFIG, $encodeQueryParams, $getLocalUrl, $http, $window);
    }];

    $injector.get('$provide').factory(STORMPATH_CONFIG.SOCIAL_LOGIN_SERVICE_NAME, socialLoginFactory);
  }])

  /**
   * @ngdoc directive
   *
   * @name stormpath.spSocialLogin:spSocialLogin
   *
   * @description
   *
   * Add this directive to a button or link in order to authenticate using a social provider.
   * The value should be the account store HREF a social provider, such as Google or Facebook.
   *
   * The `sp-name` field must be set to the provider ID of the corresponding provider, e.g.
   * `google` or `facebook`.
   *
   * Any additional fields can be specified as an object, via the `sp-options` field. These
   * options will additionally be augmented (and overriden) by the options set for the given
   * provider (determined by value of `sp-name`) in {@link STORMPATH_CONFIG.SOCIAL_LOGIN_OPTIONS}.
   *
   * {@link http://docs.stormpath.com/guides/social-integrations/}
   *
   * @example
   *
   * <pre>
   * <div class="container">
   *   <button sp-social-login="http://url.example/facebook-href" sp-name="facebook" sp-options="{scope: 'email'}">Login with Facebook</button>
   * </div>
   * </pre>
   */
  .directive('spSocialLogin', ['$viewModel', '$auth', '$http', '$injector', 'STORMPATH_CONFIG', function($viewModel, $auth, $http, $injector, STORMPATH_CONFIG) {
    return {
      link: function(scope, element, attrs) {
        var providerHref = attrs.spSocialLogin;
        var blacklist = ['href', 'providerId', 'clientId'];
        var social = $injector.get(STORMPATH_CONFIG.SOCIAL_LOGIN_SERVICE_NAME);

        scope.providerName = attrs.spName;

        element.bind('click', function() {
          var options = scope.$eval(attrs.spOptions);
          var cleanOptions = {};

          angular.forEach(options, function(value, key) {
            if (value && blacklist.indexOf(key) !== -1) {
              cleanOptions[key] = value;
            }
          });

          cleanOptions = angular.extend(
            cleanOptions,
            this.STORMPATH_CONFIG.getSocialLoginConfiguration(scope.providerName)
          );

          social.authorize(providerHref, cleanOptions);
        });
      }
    };
  }])

  /**
  * @private
  *
  * @ngdoc service
  * @name stormpath.socialLogin.$processSocialAuthToken
  * @description
  *
  * Executes the flow for processing social authentication tokens returned from
  * the social login authentication redirect flow. If the token is present, it
  * is used to authenticate the user using the `stormpath_token` grant type.
  *
  * Appropriate authentication success or failure events are broadcast when the
  * authentication concludes.
  *
  * If the token is not present in the URL query parameters, the function returns
  * a resolved promise immediatelly.
  */
  .factory('$processSocialAuthToken', ['STORMPATH_CONFIG', '$parseUrl', '$window', '$injector', '$q', '$rootScope',
    function(STORMPATH_CONFIG, $parseUrl, $window, $injector, $q, $rootScope) {
      return function processSocialAuthToken() {
        var parsedUrl = $parseUrl($window.location.href);

        // If this field is present, this means that we have been redirected here
        // from a social login flow
        if (parsedUrl.search.jwtResponse) {
          var AuthService = $injector.get(STORMPATH_CONFIG.AUTH_SERVICE_NAME);
          return AuthService.authenticate({
            grant_type: 'stormpath_token',
            token: parsedUrl.search.jwtResponse
          }).then(function() {
            // Clears the URL of the token in both hashbang and HTML5 mode
            $window.location.search = '';

            $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME)
          }).catch(function(err) {
            $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_FAILURE_EVENT_NAME);
            throw err;
          });
        }

        return $q.resolve();
      };
    }]);
}());
