# Stormpath AngularJS SDK

[![NPM Version](https://img.shields.io/npm/v/stormpath-sdk-angularjs.svg?style=flat)](https://npmjs.org/package/stormpath-sdk-angularjs)
[![NPM Downloads](http://img.shields.io/npm/dm/stormpath-sdk-angularjs.svg?style=flat)](https://npmjs.org/package/stormpath-sdk-angularjs)
[![Bower Version](https://img.shields.io/bower/v/stormpath-sdk-angularjs.svg?style=flat)](https://bower.io)
[![Build Status](https://img.shields.io/travis/stormpath/stormpath-sdk-angularjs.svg?style=flat)](https://travis-ci.org/stormpath/stormpath-sdk-angularjs)

This module provides services and directives for AngularJS that will allow you to solve common user management tasks using [Stormpath](https://stormpath.com/), such as *login* and *signup*.

If you're looking for **Angular (2)** support, please see [stormpath-sdk-angular](https://github.com/stormpath/stormpath-sdk-angular).

*Stormpath is a User Management API that reduces development time with instant-on, scalable user infrastructure. Stormpath's intuitive API and expert support make it easy for developers to authenticate, manage and secure users and roles in any application.*

* [Getting Started](#getting-started)
* [Documentation](#documentation)
* [Example](#example)
* [Help](#help)
* [Contributing](#contributing)
* [License](#license)

## Getting Started

Follow these steps to add Stormpath user authentication to your AngularJS app.

1. **Install or Download the Stormpath Angular SDK**

  If you are using Bower or NPM, you can install this module with the respective command:

  ```
  npm install stormpath-sdk-angularjs --save
  ```

  ```
  bower install stormpath-sdk-angularjs --save
  ```

  If you are not using a package manager, you can download the latest source from our Github CDN by using these links:

  * [stormpath-sdk-angularjs.min.js](https://raw.githubusercontent.com/stormpath/stormpath-sdk-angularjs/master/dist/stormpath-sdk-angularjs.min.js)
  * [stormpath-sdk-angularjs.tpls.min.js](https://raw.githubusercontent.com/stormpath/stormpath-sdk-angularjs/master/dist/stormpath-sdk-angularjs.tpls.min.js)

  Then include them in your *index.html* file:

  ```html
  <script src="stormpath-sdk-angularjs.min.js"></script>
  <script src="stormpath-sdk-angularjs.tpls.min.js"></script>
  ```

2. **Add the Module to Your App's Dependencies**

  Add the `stormpath` module and templates to your app's dependencies in *app.js*:

  ```javascript
  var app = angular.module('myApp', [..., 'stormpath', 'stormpath.templates']);
  ```

3. **Configure Stormpath**

  The Angular SDK leverages the [Stormpath Client API][] for its authentication needs. Login to your Stormpath Tenant, and find your Client API domain (inside your application's policy section).  Add your Client API domain as the `ENDPOINT_PREFIX` setting, via your `.config()` function:

  ```javascript
  angular.module('myApp', [..., 'stormpath', 'stormpath.templates'])
    .config(function (STORMPATH_CONFIG) {

      // Specify your Client API domain here:

      STORMPATH_CONFIG.ENDPOINT_PREFIX = 'https://{{clientApiDomainName}}';
    });
  ```


4. **Configure Routing**

  In your app's `run()` block, configure the login state and the default state after login.

  For `ngRouter`:

  ```javascript
  angular.module('myApp')
    .run(function($stormpath){
      $stormpath.ngRouter({
        forbiddenRoute: '/forbidden',
        defaultPostLoginRoute: '/home',
        loginRoute: '/login'
      });
    });
  ```

  For `uiRouter`:

  ```javascript
  app.run(function($stormpath){
    $stormpath.uiRouter({
      loginState: 'login',
      defaultPostLoginState: 'home'
    });
  });
  ```

  Set `loginState` to your login state. If you don't have one, create one.
  Set `defaultPostLoginState` to your default state after login.



5. **Insert the Login and Registration Forms**
   
   You can use the [`sp-login-form`][] and [`sp-registration-form`][] directives to inject these default forms into your application, you should put this in the views/states where you want them to appear:

   ```html
   <div sp-login-form></div>
   ```
   
   ```html
   <div sp-registration-form></div>
   ```

    </p>
    These forms will read their configuration from the Client API and allow you to login or register for your application.
    You should now be able to use these forms to login to your application.

6. **Add Login and Logout Links**

  Use the [`sp-logout`][] directive to end the session:

  ```html
  <a ui-sref="main" sp-logout>Logout</a>
  ```

  For the login link, just point the user to your login state:

  ```html
  <a ui-sref="login">Login</a>
  ```

7. **Hide Elements When Logged In**

  Use the [`if-user`][] directive:

  ```html
  <a ui-sref="main" sp-logout if-user>Logout</a>
  ```

8. **Hide Elements When Logged Out**

  Use the [`if-not-user`][] directive:

  ```html
  <a ui-sref="login" if-not-user>Login</a>
  ```

9. **Protect Your States**

  On all states that you want to protect, add:

  ```javascript
  sp: {
    authenticate: true
  }
  ```

  For `ngRouter`:

  ```javascript
  angular.module('myApp')
    .config(function ($routeProvider) {
      $routeProvider
        .when('/profile', {
          templateUrl: 'app/profile/profile.html',
          controller: 'ProfileCtrl',
          sp: {
            authenticate: true
          }
        });
    });
  ```

  For `uiRouter`:

  ```javascript
  angular.module('myApp')
    .config(function ($stateProvider) {
      $stateProvider
        .state('profile', {
          url: '/profile',
          templateUrl: 'app/profile/profile.html',
          controller: 'ProfileCtrl',
          sp: {
            authenticate: true
          }
        });
    });
  ```


10. **Login!**

  That's it!  You just added user authentication to your app with Stormpath. See the [API Documentation][] for further information on how Stormpath can be used with your AngularJS app.

  Looking for social login?  Simply configure the directories in your Stormpath tenant, and the buttons will automatically appear in the login form.  For more reading, please see the [Social Login Product Guide][].

11. **Making Authenticated Requests**
  
  Once you are able to successfully authenticate (log in) from your application, you will want to authorize access to API endpoints on your server.  The Angular SDK provides methods for getting the current authenticated access token, and using it to authenticate requests.

  Imagine you have an API on your server, such as `http://localhost:3000/api/subscription`, and you want to authorize requests to this endpoint and know who the user is.

  If you want to manually construct a request, using the `$http` library, you can use our access token getter to add the access token to the request:

  ```javascript
  StormpathOAuthToken.getAccessToken()
    .then(function(accessToken){
      $http({
        url: 'http://localhost:3000/api/subscription',
        method: 'GET',
        headers: {
          Authorization: 'Bearer ' + accessToken
        }
      });
    })
    .catch(function() {
      // No access token, the user is not logged in
    });
  ```

  If you don't want to manually add the access token to every request, you can white-list URLs by expression and the Angular SDK will automatically add this token to all requests that have a matching URL:

  ```javascript
  angular.module('myApp', [..., 'stormpath', 'stormpath.templates'])
    .config(function (STORMPATH_CONFIG) {

      // Automatically add access token to all /api requests

      STORMPATH_CONFIG.AUTO_AUTHORIZED_URIS.push(new RegExp('/api'));
    });
  ```

12. **Authorizing Requests Server-Side**

  Once your app has made the request with the access token, your server will need to read the token and make an authorization decision.  We provide SDKs for your backend server that make this easy.  Please follow one of the following links for a language-specific or framework-specific guide:

  **Java**

  Spring Boot developers should make use of our Spring Boot plugin, and see the [Token Management Documentation](https://docs.stormpath.com/java/spring-boot-web/tutorial.html#token-management).

  **.NET**
  
  ASP.NET developers can leverage our [ASP.NET](https://docs.stormpath.com/dotnet/aspnet/latest/) and [ASP.NET Core](https://docs.stormpath.com/dotnet/aspnetcore/latest/) libraries to achieve authorization in their applications, please see the Authorization section of each guide.
          
  **Node.js**
  
  Express developers can use our [Express-Stormpath](https://docs.stormpath.com/nodejs/express/latest/) library to easily authenticate requests with access tokens and make authorization decisions, please see the [Token Authentication](https://docs.stormpath.com/nodejs/express/latest/authentication.html#token-authentication) documentation.
  
  Node applications can generically use the [Stormpath Node SDK](https://docs.stormpath.com/nodejs/jsdoc/) to validate tokens, using the [JwtAuthenticator](https://docs.stormpath.com/nodejs/jsdoc/JwtAuthenticator.html).

  **PHP**

  Laravel developers can use our <a href="https://docs.stormpath.com/php/laravel/latest/index.html">Stormpath-Laravel</a> or [Stormpath-Lumen](https://docs.stormpath.com/php/lumen/latest/index.html) libraries and their respective `stormpath.auth` middleware to authenticate requests, please see the User Data section of the documentation for each library.

  **Other**
          
  Don't see your environment listed?  Not a problem!  Our access tokens are simple JWTs, that can be validated with most generic JWT validation libraries.  Our product guide can walk you through the process, [Validating an Access Token](https://docs.stormpath.com/rest/product-guide/latest/auth_n.html#validating-an-access-token").

  Need more assistance? Feel free to contact our support channel, details are below.

## Documentation

For all available directives and services, see the [API Documentation][].

## Example

See the [example app][] in this repository for an example application that uses
Yeoman as it's boilerplate.

For a simplified example that does not use a boilerplate system, please see
this repository:

[Stormpath Angular + Express Fullstack Sample Project](https://github.com/stormpath/express-stormpath-angular-sample-project)

If you are hosting your API on a different domain than your Angular application,
please see the [CORS example app][] in this repository.

## Browserify

This module can be used with Browserify.  Please add the following lines to your
`package.json` file:

```json
"browser": {
  "stormpath": "./node_modules/stormpath-sdk-angularjs/dist/stormpath-sdk-angularjs.js",
  "stormpath.templates": "./node_modules/stormpath-sdk-angularjs/dist/stormpath-sdk-angularjs.tpls.js"
}
```

You should also install the package `angular-ui-router`, as our library
currently depends on it.

Then in your application you can use `require` to require our modules:

```javascript
var app = angular.module('todoApp', [
  require('angular-ui-router'),
  require('stormpath'),
  require('stormpath.templates')
]);
```

## Support

We're here to help if you get stuck.  There are several ways that you an get in
touch with a member of our team:

* Send an email to [support@stormpath.com](mailto:support@stormpath.com)
* Open a Github Issue on this repository.
* Join us on our Slack channel: [https://talkstormpath.shipit.xyz/](https://talkstormpath.shipit.xyz/)

[Stormpath AngularJS SDK]: https://github.com/stormpath/stormpath-sdk-angularjs
[Stormpath Product Guide]: https://docs.stormpath.com/rest/product-guide/latest/
[Stormpath React SDK]: https://github.com/stormpath/stormpath-sdk-react
[express-stormpath]: https://docs.stormpath.com/nodejs/express/latest/

## Contributing

Found something you want to change? Please see the [Contribution Guide](CONTRIBUTING.md),
we love your input!

## License

Apache 2.0, see [LICENSE](LICENSE).

[`if-user`]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifUser:ifUser
[`if-not-user`]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.ifNotUser:ifNotUser
[`sp-login-form`]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLoginForm:spLoginForm
[`sp-logout`]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spLogout:spLogout
[`sp-registration-form`]: https://docs.stormpath.com/angularjs/sdk/#/api/stormpath.spRegistrationForm:spRegistrationForm
[example app]: https://github.com/stormpath/stormpath-sdk-angularjs/tree/master/example/dashboard-app
[API Documentation]: https://docs.stormpath.com/angularjs/sdk/
[Server Integration Guide]: https://docs.stormpath.com/angularjs/sdk/#/server
[express-stormpath]: https://github.com/stormpath/express-stormpath
[Stormpath SPA Development Server]: https://github.com/stormpath/stormpath-spa-dev-server
[UI-Router]: https://github.com/angular-ui/ui-router
[Yeoman Guide]: https://docs.stormpath.com/angularjs/guide
[support center]: https://support.stormpath.com
[CORS example app]: https://github.com/stormpath/stormpath-sdk-angularjs/tree/master/example/cors-app
[Stormpath Client API]: https://docs.stormpath.com/client-api/product-guide/latest/index.html
[Social Login Product Guide]: https://docs.stormpath.com/rest/product-guide/latest/auth_n.html#how-social-authentication-works
