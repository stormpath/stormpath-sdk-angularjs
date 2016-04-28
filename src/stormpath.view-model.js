(function () {
  'use strict';

  function ViewModelService($http, STORMPATH_CONFIG) {
    this.$http = $http;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
  }

  ViewModelService.prototype.getLoginModel = function getLoginModel() {
    return this.$http.get(this.STORMPATH_CONFIG.getUrl('AUTHENTICATION_ENDPOINT'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {

      var supportedProviders = ['facebook', 'google'];

      var model = response.data;

      model.accountStores = model.accountStores.filter(function (accountStore) {
        var providerId = accountStore.provider.providerId;

        return supportedProviders.indexOf(providerId) > -1;
      });
      return model;
    });
  };

  ViewModelService.prototype.getRegisterModel = function getRegisterModel() {
    return this.$http.get(this.STORMPATH_CONFIG.getUrl('REGISTER_URI'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      return response.data;
    });
  };

  angular.module('stormpath.viewModelService', [])
  .provider('$viewModel', function () {
    this.$get = ['$http', 'STORMPATH_CONFIG', function viewModelFactory($http, STORMPATH_CONFIG) {
      return new ViewModelService($http, STORMPATH_CONFIG);
    }];
  });
}());
