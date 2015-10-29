'use strict';

angular.module('dashboardApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/verify', {
        templateUrl: 'app/verify/verify.html',
        controller: 'VerifyCtrl'
      });
  });