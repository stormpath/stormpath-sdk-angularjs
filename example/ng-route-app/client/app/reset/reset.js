'use strict';

angular.module('dashboardApp')
  .config(function ($routeProvider) {
    $routeProvider
      .when('/reset', {
        templateUrl: 'app/reset/reset.html',
        controller: 'ResetCtrl'
      });
  });