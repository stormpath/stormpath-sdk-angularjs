'use strict';


function MFAController(STORMPATH_CONFIG, $http) {
  this.STORMPATH_CONFIG = STORMPATH_CONFIG;

  this.$http = $http;

  this.posting = false;
  this.error = null;
}

MFAController.prototype.submit = function submit() {
  this.error = null;

  if (this.action.type === 'factor_challenge') {
    // send via oauth:
    var request = {
      grant_type: 'stormpath_factor_challenge',
      state: this.action.state,
      code: this.code
    };
    console.log(request);
  } else if (this.action.type === '') {

  } else {
    this.error = 'An error has occurred. Please try refreshing the application.';
  }
};

angular.module('stormpath')
.controller('SpMultifactorFormCtrl', [function () {
  return new MFAController();
}])

.directive('spMultifactorForm', function() {
  return {
    templateUrl: function(tElemenet, tAttrs) {
      return tAttrs.templateUrl || 'spLoginForm.tpl.html';
    },
    controller: 'SpMultifactorFormCtrl as mfa',
    scope: {
      action: '='
    }
  };
});
