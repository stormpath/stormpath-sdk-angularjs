'use strict';

function StormpathMultifactorAuthenticator(STORMPATH_CONFIG, $q, $http, $spFormEncoder, $rootScope, StormpathOAuthToken) {
  this.STORMPATH_CONFIG = STORMPATH_CONFIG;

  this.$q = $q;
  this.$http = $http;
  this.$spFormEncoder = $spFormEncoder;
  this.$rootScope = $rootScope;

  this.StormpathOAuthToken = StormpathOAuthToken;
}

StormpathMultifactorAuthenticator.prototype.setChallenge = function(action) {
  this.action = action;
};

StormpathMultifactorAuthenticator.prototype.getChallenge = function() {
  return this.action;
};

StormpathMultifactorAuthenticator.prototype.challenge = function(factor, code) {
  var self = this;
  var data = {
    grant_type: 'stormpath_factor_challenge',
    state: factor.state,
    code: code
  };

  return this.$http(
    this.$spFormEncoder.formPost({
      url: this.STORMPATH_CONFIG.getUrl('OAUTH_AUTHENTICATION_ENDPOINT'),
      method: 'POST',
      headers: {
        Accept: 'application/json'
      },
      data: data
    })
  ).then(function(response) {
    return self.StormpathOAuthToken.setToken(response.data);
  }).then(function() {
    self.$rootScope.$broadcast(self.STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME);
  }).catch(function(err) {
    self.$rootScope.$broadcast(self.STORMPATH_CONFIG.AUTHENTICATION_FAILURE_EVENT_NAME);
    throw err;
  });
};

StormpathMultifactorAuthenticator.prototype.enroll = function(factor, enrollment) {
  var data = angular.extend({
    state: factor.state
  }, enrollment);

  return this.$http.post(this.STORMPATH_CONFIG.getUrl('FACTOR_ENDPOINT'), data, {
    headers: {
      Accept: 'application/json'
    }
  });
};

StormpathMultifactorAuthenticator.prototype.selectFactor = function(factor) {
  var data = {
    state: factor.state
  };

  return this.$http.post(this.STORMPATH_CONFIG.getUrl('FACTOR_ENDPOINT'), data, {
    headers: {
      Accept: 'application/json'
    }
  });
};

/**
*
*/
function FactorViewModel(factor) {
  this.factor = factor;
}

FactorViewModel.prototype.getIcon = function getIcon() {
  return this.factor.type === 'sms'
    ? '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path class="path" d="M15.5 1h-8C6.12 1 5 2.12 5 3.5v17C5 21.88 6.12 23 7.5 23h8c1.38 0 2.5-1.12 2.5-2.5v-17C18 2.12 16.88 1 15.5 1zm-4 21c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5-4H7V4h9v14z"/><path d="M0 0h24v24H0z" fill="none"/></svg>'
    : '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg"><path class="path" d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/><path d="M0 0h24v24H0z" fill="none"/></svg>';
};

FactorViewModel.prototype.getTitle = function getTitle() {
  return this.factor.type === 'sms'
    ? 'SMS Text Messages'
    : 'Google Authenticator';
};

FactorViewModel.prototype.getDescription = function getDescription() {
  return this.factor.type === 'sms'
    ? 'Your carrier\'s standard charges may apply.'
    : 'A free app from Google.';
};

angular.module('stormpath.mfa', ['stormpath.CONFIG', 'stormpath.oauth', 'stormpath.utils'])
.service('StormpathMultifactorAuthenticator', StormpathMultifactorAuthenticator)

.factory('StormpathMFAInterceptor', ['STORMPATH_CONFIG', '$rootScope', '$injector', function(STORMPATH_CONFIG, $rootScope, $injector) {
  function StormpathMFAInterceptor() {}

  StormpathMFAInterceptor.prototype.response = function response(response) {
    var requiresMFA = response
      && response.status === 200
      && response.data
      && response.data.action
      && response.data.action.startsWith('factor_');

    if (requiresMFA) {
      var StormpathMultifactorAuthenticator = $injector.get('StormpathMultifactorAuthenticator');
      StormpathMultifactorAuthenticator.setChallenge(response.data);

      $rootScope.$broadcast(STORMPATH_CONFIG.MFA_REQUIRED_EVENT);
    }

    return response;
  };

  return new StormpathMFAInterceptor();
}])

.controller('SpMultifactorFormCtrl', ['STORMPATH_CONFIG', '$scope', '$q', 'StormpathMultifactorAuthenticator', function(STORMPATH_CONFIG, $scope, $q, StormpathMultifactorAuthenticator) {
  $scope.challenge = StormpathMultifactorAuthenticator.getChallenge();

  if (!$scope.challenge) {
    $scope.$emit(STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED);
  }
}])

.factory('FactorViewModel', function() {
  return FactorViewModel;
})

.controller('spMultifactorChallengeFormCtrl', ['StormpathMultifactorAuthenticator', '$scope', function(StormpathMultifactorAuthenticator, $scope) {
  $scope.submit = function submit() {
    $scope.posting = true;
    return StormpathMultifactorAuthenticator.challenge($scope.factor, $scope.code);
  };
}])

.controller('spMultifactorEnrollmentFormCtrl', ['StormpathMultifactorAuthenticator', '$scope', function(StormpathMultifactorAuthenticator, $scope) {
  $scope.newFactor = {};
  $scope.submit = function submit() {
    $scope.posting = true;
    return StormpathMultifactorAuthenticator.enroll($scope.factor, $scope.newFactor);
  };
}])

.controller('spMultifactorSelectFormCtrl', ['StormpathMultifactorAuthenticator', 'FactorViewModel', '$scope', '$sce', function(StormpathMultifactorAuthenticator, FactorViewModel, $scope, $sce) {
  $scope.factorViewModels = $scope.factors.map(function(factor) {
    return new FactorViewModel(factor);
  });

  $scope.clean = function clean(html) {
    return $sce.trustAsHtml(html);
  };

  $scope.select = function select(factor) {
    $scope.posting = true;
    return StormpathMultifactorAuthenticator.selectFactor(factor);
  };
}])

.directive('spMultifactorForm', function() {
  return {
    templateUrl: function(tElemenet, tAttrs) {
      return tAttrs.templateUrl || 'spMultifactorAuthenticationForm.tpl.html';
    },
    controller: 'SpMultifactorFormCtrl'
  };
})

.directive('spMultifactorChallengeForm', function() {
  return {
    templateUrl: function(tElement, tAttrs) {
      return tAttrs.templateUrl || 'spMultifactorChallengeForm.tpl.html';
    },
    scope: {
      factor: '=',
      posting: '='
    },
    controller: 'spMultifactorChallengeFormCtrl'
  };
})

.directive('spMultifactorEnrollmentForm', function() {
  return {
    templateUrl: function(tElement, tAttrs) {
      return tAttrs.templateUrl || 'spMultifactorEnrollForm.tpl.html';
    },
    scope: {
      factor: '=',
      posting: '='
    },
    controller: 'spMultifactorEnrollmentFormCtrl'
  };
})

.directive('spMultifactorSelectForm', function() {
  return {
    templateUrl: function(tElement, tAttrs) {
      return tAttrs.templateUrl || 'spMultifactorSelectForm.tpl.html';
    },
    scope: {
      factors: '=',
      posting: '='
    },
    controller: 'spMultifactorSelectFormCtrl'
  };
})

.config(['$httpProvider', function($httpProvider) {
  $httpProvider.interceptors.push('StormpathMFAInterceptor');
}]);
