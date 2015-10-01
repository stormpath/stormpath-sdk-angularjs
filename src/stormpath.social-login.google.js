(function() {
  'use strict';

  function GoogleLoginService($q, $spJsLoader) {
    this.name = 'Google';
    this.clientId = null;
    this.googleAuth = null;
    this.$q = $q;
    this.$spJsLoader = $spJsLoader;
  }

  GoogleLoginService.prototype.setGoogleAuth = function setGoogleAuth(auth) {
    this.googleAuth = auth;
  };

  GoogleLoginService.prototype.init = function init(element) {
    var clientId = this.clientId;
    var setGoogleAuth = this.setGoogleAuth.bind(this);

    this.$spJsLoader.load('google-jssdk', '//apis.google.com/js/api:client.js').then(function() {
      gapi.load('auth2', function() {
        var auth2 = gapi.auth2.init({
          client_id: clientId,
          cookiepolicy: 'single_host_origin'
        });

        setGoogleAuth(auth2);
      });
    });
  };

  GoogleLoginService.prototype.login = function login(options) {
    var deferred = this.$q.defer();

    options = options || {};
    options.redirect_uri = 'postmessage';

    this.googleAuth.grantOfflineAccess(options).then(function(response) {
      deferred.resolve({
        providerData: {
          providerId: 'google',
          code: response.code
        }
      });
    }, function(err) {
      deferred.reject(err);
    });

    return deferred.promise;
  };

  angular.module('stormpath.googleLogin', [])
  .provider('$googleLogin', function() {
    this.$get = ['$q', '$spJsLoader', function googleLoginFactory($q, $spJsLoader) {
      return new GoogleLoginService($q, $spJsLoader);
    }];
  });
}());
