(function () {
  'use strict';

  function ViewModelService($spHttp, STORMPATH_CONFIG) {
    this.$spHttp = $spHttp;
    this.STORMPATH_CONFIG = STORMPATH_CONFIG;
  }

  ViewModelService.prototype.getLoginModel = function getLoginModel() {
    return this.$spHttp.get(this.STORMPATH_CONFIG.getUrl('AUTHENTICATION_ENDPOINT'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      return response.data;
    });
  };

  ViewModelService.prototype.getRegisterModel = function getRegisterModel() {
    return this.$spHttp.get(this.STORMPATH_CONFIG.getUrl('REGISTER_URI'), {
      headers: {
        'Accept': 'application/json'
      }
    }).then(function (response) {
      return response.data;
    });
  };

  angular.module('stormpath.viewModelService', ['stormpath.utils'])
  .provider('$viewModel', function () {
    this.$get = ['$spHttp', 'STORMPATH_CONFIG', function viewModelFactory($spHttp, STORMPATH_CONFIG) {
      return new ViewModelService($spHttp, STORMPATH_CONFIG);
    }];
  });
}());
