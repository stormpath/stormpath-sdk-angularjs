(function () {
  'use strict';

  function ViewModelService($http, $verifyResponse, STORMPATH_CONFIG) {
    this.$http = $http;
    this.$verifyResponse = $verifyResponse;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
  }

  ViewModelService.prototype.getLoginModel = function getLoginModel() {
    var self = this;

    return this.$http.get(this.STORMPATH_CONFIG.getUrl('AUTHENTICATION_ENDPOINT'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      var responseStatus = self.$verifyResponse(response);

      if (!responseStatus.valid) {
        throw responseStatus.error;
      }

      return response.data;
    });
  };

  ViewModelService.prototype.getRegisterModel = function getRegisterModel() {
    var self = this;

    return this.$http.get(this.STORMPATH_CONFIG.getUrl('REGISTER_URI'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      var responseStatus = self.$verifyResponse(response);

      if (!responseStatus.valid) {
        throw responseStatus.error;
      }

      return response.data;
    });
  };

  angular.module('stormpath.viewModelService', ['stormpath.util'])
  .provider('$viewModel', function () {
    this.$get = ['$http', '$verifyResponse', 'STORMPATH_CONFIG', function viewModelFactory($http, $verifyResponse, STORMPATH_CONFIG) {
      return new ViewModelService($http, $verifyResponse, STORMPATH_CONFIG);
    }];
  });
}());
