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

  SocialLoginService.prototype.initProviders = function initProviders(providers) {
    var $injector = this.$injector;

    Object.keys(providers).forEach(function(providerName) {
      var provider = providers[providerName];
      var service;

      try {
        service = $injector.get('$' + providerName + 'Login');
      } catch (err) {
        // Delete the provider from the list if we don't support it yet.
        delete providers[providerName];
        return;
      }

      service.clientId = provider.clientId;
      providers[providerName].service = service;
    });
  };

  /**
   * @ngdoc function
   *
   * @name  stormpath.socialLoginService.$socialLogin#getProviders
   *
   * @methodOf stormpath.socialLoginService.$socialLogin
   *
   * @returns {promise}
   *
   * A promise that is resolved with the list of all available OAuth providers.
   *
   * @description
   *
   * Returns a list of all OAuth providers, provided by the `/oauth/providers` endpoint.
   */
  SocialLoginService.prototype.getProviders = function getProviders() {
    var providersPromise = this.providersPromise;
    var initProviders = this.initProviders.bind(this);

    if (providersPromise) {
      return providersPromise.promise;
    }

    providersPromise = this.$q.defer();
    this.providersPromise = providersPromise;

    this.$http.get(this.STORMPATH_CONFIG.getUrl('OAUTH_PROVIDERS_ENDPOINT')).then(function(response) {
      var providers = response.data;

      initProviders(providers);

      providersPromise.resolve(providers);
    }).catch(providersPromise.reject);

    return providersPromise.promise;
  };

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
   * Add this directive to a button or link in order to authenticate using an OAuth provider. The value should be an OAuth provider id such as google or facebook.
   *
   * @example
   *
   * <pre>
   * <div class="container">
   *   <button sp-social-login="facebook" sp-scope="public_profile,email">Login with Facebook</button>
   * </div>
   * </pre>
   */
  .directive('spSocialLogin', ['$socialLogin', '$auth', function($socialLogin, $auth) {
    return {
      link: function(scope, element, attrs) {
        var providerService;
        var parentScope = scope.$parent;

        $socialLogin.getProviders().then(function(providers) {
          var provider = providers[attrs.spSocialLogin];

          if (provider && provider.service) {
            providerService = provider.service;
            providerService.init(element);
          }
        });

        element.click(function() {
          var options = { scope: attrs.spScope }; // `scope` is OAuth scope, and not Angular scope

          parentScope.posting = true;

          providerService.login(options).then(function(data) {
            return $auth.authenticate(data);
          }).catch(function(err) {
            parentScope.posting = false;

            if (err.message) {
              parentScope.error = err.message;
            } else if (err.data && err.data.error) {
              parentScope.error = err.data.error;
            } else {
              parentScope.error = 'An error occured when communicating with server.';
            }
          });
        });
      }
    };
  }]);
}());
