'use strict';

angular.module('dashboardApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/forgot', {
        templateUrl: 'app/forgot/forgot.html',
        controller: 'ForgotCtrl'
      });
  });