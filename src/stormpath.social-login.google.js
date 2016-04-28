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

  GoogleLoginService.prototype.init = function init(element, _options) {
    var options = angular.copy(_options || {});
    var setGoogleAuth = this.setGoogleAuth.bind(this);

    options.client_id = this.clientId;

    this.$spJsLoader.load('google-jssdk', '//apis.google.com/js/api:client.js').then(function() {
      gapi.load('auth2', function() {
        var auth2 = gapi.auth2.init(options);

        setGoogleAuth(auth2);
      });
    });
  };

// https://accounts.google.com/AccountChooser?continue=https://accounts.google.com/o/oauth2/auth?access_type%3Doffline%26openid.realm%26scope%3Demail%2Bprofile%2Bopenid%26origin%3Dhttp://localhost:3000%26response_type%3Dcode%2Bpermission%26redirect_uri%3Dstoragerelay://http/localhost:3000?id%253Dauth803280%26ss_domain%3Dhttp://localhost:3000%26client_id%3D441084632428-9au0gijbo5icagep9u79qtf7ic7cc5au.apps.googleusercontent.com%26hl%3Den-US%26from_login%3D1%26as%3D35625cb0500ad0fe&btmpl=authsub&hl=en_US&scc=1&oauth=1

  GoogleLoginService.prototype.login = function login(options) {
    var deferred = this.$q.defer();
    var googleAuth = this.googleAuth;

    options = options || {};
    options.redirect_uri = 'postmessage';

    googleAuth.signIn(options).then(function() {
      var authResponse = googleAuth.currentUser.get().getAuthResponse();

      deferred.resolve({
        providerData: {
          providerId: 'google',
          accessToken: authResponse.access_token
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
