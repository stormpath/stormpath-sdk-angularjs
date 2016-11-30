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
  function SocialLoginService(STORMPATH_CONFIG, $encodeQueryParams, $getLocalUrl, $http, $window, $q) {
    this.providersPromise = null;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
    this.$encodeQueryParams = $encodeQueryParams;
    this.$getLocalUrl = $getLocalUrl;
    this.$http = $http;
    this.$window = $window;
    this.$q = $q;
  }

  SocialLoginService.prototype.authorize = function(accountStoreHref, providerName, options) {
    var requestParams = angular.extend({
      response_type: this.STORMPATH_CONFIG.SOCIAL_LOGIN_RESPONSE_TYPE,
      account_store_href: accountStoreHref,
      redirect_uri: this.$getLocalUrl(this.STORMPATH_CONFIG.SOCIAL_LOGIN_REDIRECT_URI)
    }, options
    , this.STORMPATH_CONFIG.getSocialLoginConfiguration(providerName));

    var queryParams = this.$encodeQueryParams(requestParams);

    this.$window.location = this.STORMPATH_CONFIG.getUrl('SOCIAL_LOGIN_AUTHORIZE_URI') + queryParams;
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
    /**
     * @ngdoc object
     *
     * @name stormpath.socialLoginService.$socialLogin
     *
     * @description
     *
     * The social login service provides methods for letting users logging in with Facebook, Google, etc.
     */
    var socialLoginFactory = ['$encodeQueryParams', '$http', '$window', '$q', '$getLocalUrl', function socialLoginFactory($encodeQueryParams, $http, $window, $q, $getLocalUrl) {
      return new SocialLoginService(STORMPATH_CONFIG, $encodeQueryParams, $getLocalUrl, $http, $window, $q);
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
   * The value should be a social provider ID such as `google` or `facebook`.
   *
   * **Note:** If you are using Google+ Sign-In for server-side apps, Google recommends that you
   * leave the Authorized redirect URI field blank in the Google Developer Console. In Stormpath,
   * when creating the Google Directory, you must set the redirect URI to `postmessage`.
   *
   * {@link http://docs.stormpath.com/guides/social-integrations/}
   *
   * @example
   *
   * <pre>
   * <div class="container">
   *   <button sp-social-login="facebook" sp-client-id="oauth client id" sp-scope="public_profile,email">Login with Facebook</button>
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
            if (value && !blacklist.includes(key)) {
              cleanOptions[key] = value;
            }
          });

          social.authorize(providerHref, attrs.spName, cleanOptions);
        });
      }
    };
  }])

  .run(['STORMPATH_CONFIG', '$parseUrl', '$window', '$injector', function(STORMPATH_CONFIG, $parseUrl, $window, $injector) {
    var parsedUrl = $parseUrl($window.location.href);

    // If this field is present, this means that we have been redirected here
    // from a social login flow
    if (parsedUrl.search.jwtResponse) {
      var AuthService = $injector.get(STORMPATH_CONFIG.AUTH_SERVICE_NAME);
      AuthService.authenticate({
        grant_type: 'stormpath_social',
        providerId: 'google',
        accessToken: parsedUrl.search.jwtResponse
      });
    }
  }]);
}());
