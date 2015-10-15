// We've disabled support for social login with LinkedIn until we've
// solved how to manage the differences between other OAuth providers.
// https://developer-programs.linkedin.com/documents/exchange-jsapi-tokens-rest-api-oauth-tokens

(function() {
  'use strict';

  // Returns a string in LinkedIn's format for initializing the SDK
  // https://developer.linkedin.com/docs/signin-with-linkedin
  function buildLinkedInSDKConfig(clientId) {
    return 'api_key: ' + clientId + '\n' + 'authorize: true';
  }

  function loadLinkedInSDK($spJsLoader, clientId) {
    var innerHTML = buildLinkedInSDKConfig(clientId);

    $spJsLoader.load('linkedin-jssdk', '//platform.linkedin.com/in.js', innerHTML);
  }

  function LinkedInLoginService($q, $spJsLoader) {
    this.name = 'LinkedIn';
    this.clientId = null;
    this.$q = $q;
    this.$spJsLoader = $spJsLoader;
  }

  LinkedInLoginService.prototype.init = function init(element) {
    loadLinkedInSDK(this.$spJsLoader, this.clientId);
  };

  LinkedInLoginService.prototype.login = function login(options) {
    var deferred = this.$q.defer();

    IN.User.authorize(function() {
      deferred.resolve({
        providerData: {
          providerId: 'linkedin',
          accessToken: IN.ENV.auth.oauth_token
        }
      });
    });

    return deferred.promise;
  };

  angular.module('stormpath.linkedinLogin', [])
  .provider('$linkedinLogin', function() {
    this.$get = ['$q', '$spJsLoader', function linkedInLoginFactory($q, $spJsLoader) {
      return new LinkedInLoginService($q, $spJsLoader);
    }];
  });
}());
