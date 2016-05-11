'use strict';
/**
 * @ngdoc overview
 *
 * @name  stormpath.authService
 *
 * @description
 *
 * This module provides the {@link stormpath.authService.$auth $auth} service.
 *
 * Currently, this provider does not have any configuration methods.
 */
/**
 * @ngdoc object
 *
 * @name stormpath.authService.$authProvider
 *
 * @description
 *
 * Provides the {@link stormpath.authService.$auth $auth} service.
 *
 * Currently, this provider does not have any configuration methods.
 */
angular.module('stormpath.auth',['stormpath.CONFIG'])
.config(['$injector','STORMPATH_CONFIG',function $authProvider($injector,STORMPATH_CONFIG){
  /**
   * @ngdoc object
   *
   * @name stormpath.authService.$auth
   *
   * @description
   *
   * The auth service provides methods for authenticating a user, aka
   * "logging in" the user.
   */
  var authServiceProvider = {
    $get: ['$http','$user','$rootScope','$spFormEncoder',function authServiceFactory($http,$user,$rootScope,$spFormEncoder){

      function AuthService(){
        return this;
      }
      AuthService.prototype.authenticate = function authenticate(data) {
        /**
         * @ngdoc function
         *
         * @name  stormpath.authService.$auth#authenticate
         *
         * @methodOf stormpath.authService.$auth
         *
         * @param {Object} credentialData
         *
         * An object literal for passing username & password, or social provider
         * token.
         *
         * @returns {promise}
         *
         * A promise that is resolved with the authentication response or error
         * response (both are response objects from the $http service).
         *
         * @description
         *
         * Logs the user in.
         *
         * Sends the provided credential data to your backend server. The server
         * handler should verify the credentials and return an access token,
         * which is stored in an HTTP-only cookie.
         *
         * @example
         *
         * ## Username & Password example
         *
         * <pre>
         * myApp.controller('LoginCtrl', function ($scope, $auth, $state) {
         *   $scope.errorMessage = null;
         *   $scope.formData = {
         *     username: '',         // Expose to user as email/username field
         *     password: '',
         *   };
         *
         *   // Use this method with ng-submit on your form
         *   $scope.login = function login(formData){
         *     $auth.authenticate(formData)
         *      .then(function(){
         *        console.log('login success');
         *        $state.go('home');
         *      })
         *      .catch(function(err){
         *        $scope.errorMessage = err.message;
         *      });
         *   }
         *
         * });
         * </pre>
         *
         * ## Social Login example
         *
         * <pre>
         * myApp.controller('LoginCtrl', function ($scope, $auth, $state) {
         *   $scope.errorMessage = null;
         *   $scope.formData = {
         *     providerId: 'facebook',         // Get access token from FB sdk login
         *     accessToken: 'CABTmZxAZBxBADbr1l7ZCwHpjivBt9T0GZBqjQdTmgyO0OkUq37HYaBi4F23f49f5',
         *   };
         *
         *   // Use this method with ng-submit on your form
         *   $scope.login = function login(formData){
         *     $auth.authenticate(formData)
         *      .then(function(){
         *        console.log('login success');
         *        $state.go('home');
         *      })
         *      .catch(function(err){
         *        $scope.errorMessage = err.message;
         *      });
         *   }
         *
         * });
         * </pre>
         */
        var op = $http($spFormEncoder.formPost({
            url: STORMPATH_CONFIG.getUrl('AUTHENTICATION_ENDPOINT'),
            method: 'POST',
            headers: {
              'Accept': 'application/json'
            },
            withCredentials: true,
            data: data
          })
        );
        var op2 = op.then(cacheCurrentUser).then(authenticatedEvent);
        op.catch(authenticationFailureEvent);
        return op2;

      };

      /**
       * @ngdoc event
       *
       * @name stormpath.authService.$user#$sessionEnd
       *
       * @eventOf stormpath.authService.$auth
       *
       * @eventType broadcast on root scope
       *
       * @param {Object} event
       *
       * Angular event object.

       * @description
       *
       * This event is broadcast when a call to
       * {@link stormpath.authService.$auth#methods_endSession $auth.endSession()}
       * is successful.  Use this event when you want to do something after the
       * user has logged out.
       */
      function endSessionEvent () {
        $rootScope.$broadcast(STORMPATH_CONFIG.SESSION_END_EVENT);
      }

      /**
       * @ngdoc function
       *
       * @name stormpath.authService.$auth#endSession
       *
       * @methodOf stormpath.authService.$auth
       *
       * @return {promise} A promise that is resolved when the logout request
       * of the server is complete.
       *
       * @description Use this method to log the user out. It triggers a request
       * to the `/logout` endpoint on the server.  This will delete the cookies
       * that are used for authentication.  The
       * {@link stormpath.authService.$auth#events_$sessionEnd $sessionEnd}
       * event will be emitted after a successful logout.
       */
      AuthService.prototype.endSession = function endSession(){
        var op = $http.post(STORMPATH_CONFIG.getUrl('DESTROY_SESSION_ENDPOINT'), null, {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        op.then(function(){
          endSessionEvent();
        },function(response){
          console.error('logout error',response);
        });

        return op;
      };

      function cacheCurrentUser(){
        return $user.get();
      }

      function authenticatedEvent(response){
        /**
         * @ngdoc event
         *
         * @name stormpath.authService.$auth#$authenticated
         *
         * @eventOf stormpath.authService.$auth
         *
         * @eventType broadcast on root scope
         *
         * @param {Object} event
         *
         * Angular event object.
         *
         * @param {httpResponse} httpResponse
         *
         * The http response from the $http service.  If you are writing your access tokens to the response body
         * when a user authenticates, you will want to use this response object to get access to that token.
         *
         * @description
         *
         * This event is broadcast when a call to
         * {@link stormpath.authService.$auth#methods_authenticate $auth.authenticate()}
         * is successful.
         */
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_SUCCESS_EVENT_NAME,response);
      }
      function authenticationFailureEvent(response){
        $rootScope.$broadcast(STORMPATH_CONFIG.AUTHENTICATION_FAILURE_EVENT_NAME,response);
      }
      return new AuthService();
    }]
  };

  $injector.get('$provide')
    .provider(STORMPATH_CONFIG.AUTH_SERVICE_NAME,authServiceProvider);

}]);
