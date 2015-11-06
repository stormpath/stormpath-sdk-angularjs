(function() {
  'use strict';

  function loginCallback(deferred, response) {
    var data;

    switch (response.status) {
      case 'connected':
        deferred.resolve({
          providerData: {
            providerId: 'facebook',
            accessToken: response.authResponse.accessToken
          }
        });
        break;

      case 'not_authorized':
        deferred.reject(new Error('Please log into this app'));
        break;

      default:
        deferred.reject(new Error('Please log into Facebook.'));
    }
  }

  function FacebookLoginService($q, $spJsLoader) {
    this.name = 'Facebook';
    this.clientId = null;
    this.$q = $q;
    this.$spJsLoader = $spJsLoader;
  }

  FacebookLoginService.prototype.init = function init() {
    var clientId = this.clientId;

    window.fbAsyncInit = function() {
      FB.init({
        appId: clientId,
        status: true,
        cookie: true,
        xfbml: true,
        version: 'v2.4'
      });
    };

    if (window.FB) {
      window.fbAsyncInit();
    } else {
      this.$spJsLoader.load('facebook-jssdk', '//connect.facebook.net/en_US/sdk.js');
    }
  };

  FacebookLoginService.prototype.login = function login(options) {
    var deferred = this.$q.defer();

    FB.login(loginCallback.bind(null, deferred), options);

    return deferred.promise;
  };

  angular.module('stormpath.facebookLogin', [])
  .provider('$facebookLogin', function() {
    this.$get = ['$q', '$spJsLoader', function facebookLoginFactory($q, $spJsLoader) {
      return new FacebookLoginService($q, $spJsLoader);
    }];
  });
}());
