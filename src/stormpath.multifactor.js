'use strict';

function MFAService(STORMPATH_CONFIG, $http, $spFormEncoder) {
  this.STORMPATH_CONFIG = STORMPATH_CONFIG;

  this.$http = $http;
  this.$spFormEncoder = $spFormEncoder;
}

MFAService.prototype.requiresMultifactorAuthentication = function(response) {
  return response.status === 200
    && response.action
    && response.action.type
    && response.action.type.startsWith('factor_');
};

MFAService.prototype.challenge = function(factor, code) {
  var data = {
    grant_type: 'stormpath_factor_challenge',
    state: factor.state,
    code: code
  };

  return this.$http(
    this.$spFormEncoder.formPost({
      url: this.STORMPATH_CONFIG.getUrl('OAUTH_ENDPOINT'),
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      data: data
    })
  );
};

MFAService.prototype.enroll = function(factor, factorData) {
  var data = angular.extend({
    state: factor.state
  }, factorData);

  return this.$http.post(this.STORMPATH_CONFIG.getUrl('FACTOR_ENDPOINT'), data, {
    headers: {
      Accept: 'application/json'
    }
  });
};

MFAService.prototype.selectFactor = function(factor) {
  var data = {
    state: factor.state
  };

  return this.$http.post(this.STORMPATH_CONFIG.getUrl('FACTOR_ENDPOINT'), data, {
    headers: {
      Accept: 'application/json'
    }
  });
};

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
