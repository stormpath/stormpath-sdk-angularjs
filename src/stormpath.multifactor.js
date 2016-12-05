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

MFAService.prototype.challenge = function(factor, challenge) {
  var data = angular.extend({
    grant_type: 'stormpath_factor_challenge',
    state: factor.state
  }, challenge);

  return this.$http(
    this.$spFormEncoder.formPost({
      url: this.STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'),
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      data: data
    })
  );
};

MFAService.prototype.enroll = function(factor, enrollment) {
  var data = angular.extend({
    state: factor.state
  }, enrollment);

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

angular.module('stormpath')
.service('MFAService', MFAService)
.controller('SpMultifactorFormCtrl', ['STORMPATH_CONFIG', '$scope', '$q', 'MFAService', function(STORMPATH_CONFIG, $scope, $q, MFAService) {

  $scope.submit = function submit() {
    var promise;

    $scope.posting = true;

    switch ($scope.action.type) {
    case 'factor_challenge':
      promise = MFAService.challenge($scope.action.factors[0], $scope.challenge.code);
      break;
    case 'factor_enroll':
      //TODO add case
      promise = $q.reject('Work in progress');
      break;
    case 'factor_select':
      promise = MFAService.challenge($scope.selectedFactor);
      break;
    default:
      promise = $q.reject('Invalid multifactor action type: ' + $scope.action.type);
    }

    promise
    .then(function(response) {
      $scope.posting = false;
      return response;
    })
    .catch(function(error) {
      $scope.posting = false;
      $scope.error = error.message;
    });
  };
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
