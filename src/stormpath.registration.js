'use strict';

angular.module('stormpath')
.controller('SpRegistrationFormCtrl', ['$scope','$user','$auth','$location','$socialLogin','$injector', function ($scope,$user,$auth,$location,$socialLogin, $injector) {
  $scope.formModel = (typeof $scope.formModel==='object') ? $scope.formModel : {
    givenName:'',
    surname: '',
    email: '',
    password: ''
  };
  $scope.created = false;
  $scope.enabled = false;
  $scope.creating = false;
  $scope.authenticating = false;
  $scope.socialLoginProviders = [];

  // Load list of social login providers from server.
  $socialLogin.getProviders().then(function(providers) {
    // Convert into an array.
    $scope.socialLoginProviders = Object.keys(providers).map(function(providerName) {
      var provider = providers[providerName];
      provider.name = providerName;
      return provider;
    });

    // Filter out the enabled providers.
    $scope.socialLoginProviders = $scope.socialLoginProviders.filter(function(provider) {
      return provider.enabled;
    });
  }).catch(function(err) {
    throw new Error('Could not load social providers from back-end: ' + err.message);
  });

  $scope.submit = function(){
    $scope.creating = true;
    $scope.error = null;
    $user.create($scope.formModel)
      .then(function(account){
        $scope.created = true;
        $scope.enabled = account.status === 'ENABLED';
        if($scope.enabled && $scope.autoLogin){
          $scope.authenticating = true;
          $auth.authenticate({
            username: $scope.formModel.email,
            password: $scope.formModel.password
          })
          .then(function(){
            var $state = $injector.get('$state');
            if($scope.postLoginState && $state){
              $state.go($scope.postLoginState);
            }
            else if($scope.postLoginPath){
              $location.path($scope.postLoginPath);
            }
          })
          .catch(function(response){
            $scope.error = response.data.error;
          })
          .finally(function(){
            $scope.authenticating = false;
            $scope.creating = false;
          });
        }else{
          $scope.creating = false;
        }
      })
      .catch(function(response){
        $scope.creating = false;
        $scope.error = response.data.error;
      });
  };
}])


/**
 * @ngdoc directive
 *
 * @name stormpath.spRegistrationForm:spRegistrationForm
 *
 * @param {boolean} autoLogin
 *
 * Default `false`. Automatically authenticate the user
 * after creation.  This makes a call to
 * {@link stormpath.authService.$auth#methods_authenticate $auth.authenticate}, which will
 * trigger the event {@link stormpath.authService.$auth#events_$authenticated $authenticated}.
 * This is not possible if the email verification workflow is enabled on the directory that
 * the account is created in.
 *
 * @param {string} postLoginState
 *
 * If using the `autoLogin` option, you can specify the name of a UI state that the user
 * should be redirected to after they successfully have registered.  This is a UI Router
 * integration, and requires that module.
 *
 * @param {string} postLoginPath
 *
 * If using the `autoLogin` option, you can specify the path that the user
 * should be sent to after registration.  This value is passed to
 * `$location.path()` and does not require a specific routing module.
 *
 * @param {string} template-url
 *
 * An alternate template URL if you want
 * to use your own template for the form.
 *
 *
 * @description
 *
 * This directive will render a pre-built user registration form with the following
 * fields:
 *  * First Name
 *  * Last Name
 *  * Email
 *  * Password
 *
 * # Customizing the Form
 *
 * If you would like to customize the form:
 *
 * * Create a new view file in your application.
 * * Copy our default template HTML code into your file, found here:
 * <a href="https://github.com/stormpath/stormpath-sdk-angularjs/blob/master/src/spRegistrationForm.tpl.html" target="_blank">spRegistrationForm.tpl.html</a>.
 * * Modify the template to fit your needs, making sure to use `formModel.<FIELD>` as the
 * value for `ng-model` where `.<FIELD>` is the name of the field you want to set on
 * the new account (such as `middleName`).
 * * Use the `template-url` option on the directive to point to your new view file.
 *
 * Any form fields you supply that are not one of the default fields (first name, last name)
 * will be automatically placed into the new account's customa data object.
 *
 * # Email Verification
 *
 * If you are using the email verification workflow, the default template has a message,
 * which will be shown to the user, telling them that they need to check their email
 * for verification.
 *
 * If you are NOT using the email verification workflow, you can, optionally,
 * automatically login the user and redirect them to a UI state in your application.
 * See the options below.
 *
 * # Server Interaction
 *
 * This directive makes a call to
 * {@link stormpath.userService.$user#methods_create $user.create()}
 * when it is ready to POST the form to the server. Please see that method
 * for more information.
 *
 * @example
 *
 * <pre>
 * <!-- If you want to use the default template -->
 * <div class="container">
 *   <div sp-registration-form post-login-state="main"></div>
 * </div>
 *
 * <!-- If you want to use your own template -->
 * <div class="container">
 *   <div sp-registration-form template-url="/path/to/my-custom-template.html"></div>
 * </div>
 * </pre>
 */
.directive('spRegistrationForm',function(){
  return {
    templateUrl: function(tElemenet,tAttrs){
      return tAttrs.templateUrl || 'spRegistrationForm.tpl.html';
    },
    controller: 'SpRegistrationFormCtrl',
    link: function(scope,element,attrs){
      scope.autoLogin = attrs.autoLogin==='true';
      scope.postLoginPath = attrs.postLoginPath || '';
      scope.postLoginState = attrs.postLoginState || '';
    }
  };
});