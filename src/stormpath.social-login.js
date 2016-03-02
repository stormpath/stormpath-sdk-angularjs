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
  function SocialLoginService(STORMPATH_CONFIG, $injector, $http, $q) {
    this.providersPromise = null;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
    this.$injector = $injector;
    this.$http = $http;
    this.$q = $q;
  }

  angular.module('stormpath.socialLogin', ['stormpath.CONFIG'])

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
    var socialLoginFactory = ['$http', '$q', '$injector', function socialLoginFactory($http, $q, $injector) {
      return new SocialLoginService(STORMPATH_CONFIG, $injector, $http, $q);
    }];

    $injector.get('$provide').factory(STORMPATH_CONFIG.SOCIAL_LOGIN_SERVICE_NAME, socialLoginFactory);
  }])

  /**
   * @ngdoc object
   *
   * @name stormpath.socialLoginService.$spJsLoader
   *
   * @description
   *
   * The `$spJsLoader` provides a method for loading scripts during runtime.
   * Used by the social provider services to load their SDKs.
   */
  .factory('$spJsLoader', ['$q', function($q) {
    return {
      load: function load(id, src, innerHTML) {
        var deferred = $q.defer();
        var firstJsElement = document.getElementsByTagName('script')[0];
        var jsElement = document.createElement('script');

        if (document.getElementById(id)) {
          deferred.resolve();
        } else {
          jsElement.id = id;
          jsElement.src = src;
          jsElement.innerHTML = innerHTML;
          jsElement.onload = deferred.resolve;

          firstJsElement.parentNode.insertBefore(jsElement, firstJsElement);
        }

        return deferred.promise;
      }
    };
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
  .directive('spSocialLogin', ['$viewModel', '$auth', '$injector', function($viewModel, $auth, $injector) {
    return {
      link: function(scope, element, attrs) {
        var providerService;
        var parentScope = scope.$parent;

        try {
          providerService = $injector.get('$' + attrs.spSocialLogin + 'Login');
        } catch (err) {
          return;
        }

        providerService.clientId = attrs.spClientId;
        providerService.init(element);

        scope.providerName = providerService.name;

        element.bind('click', function() {
          var options = { scope: attrs.spScope }; // `scope` is OAuth scope, not Angular scope

          parentScope.posting = true;

          providerService.login(options).then(function(data) {
            return $auth.authenticate(data);
          }).catch(function(err) {
            parentScope.posting = false;

            if (err.message) {
              parentScope.error = err.message;
            } else {
              parentScope.error = 'An error occured when communicating with server.';
            }
          });
        });
      }
    };
  }]);
}());
