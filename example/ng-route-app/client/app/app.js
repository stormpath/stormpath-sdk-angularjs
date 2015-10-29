'use strict';

angular.module('dashboardApp', [
  'ngCookies',
  'ngResource',
  'ngSanitize',
  'ngRoute',
  'stormpath',
  'stormpath.templates'
])
  .config(function ($routeProvider, $locationProvider) {
    $routeProvider.otherwise('/');
    $locationProvider.html5Mode(true);
  })
  .run(function($stormpath, $rootScope, $location) {
    $stormpath.ngRouter({
      loginRoute: '/login',
      defaultPostLoginRoute: '/'
    });

    $rootScope.$on('$sessionEnd', function() {
      $location.path('/login');
    });
  });