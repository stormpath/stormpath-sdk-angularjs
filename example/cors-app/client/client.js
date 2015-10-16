'use strict';

angular.module('loginApp',[
  'stormpath',
  'stormpath.templates'
])
.config(['STORMPATH_CONFIG',function (STORMPATH_CONFIG) {
  /*
    We tell the Stormpath library that our API service is
    on the other domain by setting the prefix for all requests
   */
  STORMPATH_CONFIG.ENDPOINT_PREFIX = 'http://b.localhost:4000';
}])
.controller('ProtectedResourceController',['$scope','$http','$rootScope',function ($scope,$http,$rootScope) {
  $scope.$on('$currentUser',function () {
    $http.get('http://b.localhost:4000/api/thing')
      .then(function (thing) {
        $scope.thing = thing;
      });
  });
}]);

