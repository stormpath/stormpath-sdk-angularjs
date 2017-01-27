'use strict';

/**
* @ngdoc overview
*
* @name stormpath.ui-router
*
* @description
*
* This module provides the {@link stormpath.ui.router:StormpathUIRouter StormpathUIRouter}
* service, which handles Stormpath's integration with UIRouter (both 0.*.* and 1.**).
*/
angular
  .module('stormpath.ui-router', ['stormpath.userService'])
  .service('StormpathUIRouter', StormpathUIRouter);

/**
 * @ngdoc service
 * @name stormpath.ui.router:StormpathUIRouterTransition
 * @description
 *
 * Encapsulates UIRouter state transitions for both versions 0.*.* and 1.*.*
 * Expects UIRouter's `$state` as the first argument, and the transition start
 * `arguments` as the second argument. It provides normalised access to the
 * standard state transition manually.
 *
 * Should <b>never</b> be instantiated in client code. This class is meant only
 * for private use in the {@link stormpath.ui.router:StormpathUIRouter StormpathUIRouter}
 * service.
 */
function StormpathUIRouterTransition($state, args) {
  this.$state = $state;
  this._parseArguments(args);
}

StormpathUIRouterTransition.prototype._parseArguments = function _parseArguments(args) {
  if (args.length >= 5) {
    this.$event = args[0];
    this.$toState = args[1];
    this.$toParams = args[2];
    this.$fromState = args[3];
    this.$fromParams = args[4];
  } else {
    this.$trans = args[0];
  }
};

/**
 * @ngdoc method
 * @name isLegacy
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Boolean} Whether this is UI Router < 1.0.0
 *
 * @description
 * Checks whether the version of UIRouter being used is 0.*.*
 */
StormpathUIRouterTransition.prototype.isLegacy = function isLegacy() {
  return typeof this.$trans === 'undefined';
};

/**
 * @ngdoc method
 * @name sp
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Object}
 * Stormpath configuration for this state, or empty object if none is defined
 *
 * @description
 * Accesses the Stormpath state configuration (set in the `sp` property) for
 * the state currently being transitioned to. If no such configuration object
 * is defined, an empty object is returned instead.
 */
StormpathUIRouterTransition.prototype.sp = function sp() {
  return this.toState().sp || {};
};

/**
 * @ngdoc method
 * @name authorities
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Array} List of roles authorized to enter this state
 *
 * @description
 * Retrieves a list of roles that are authorized to enter this state, defined
 * in the state definition under `data.authorities`. If there is no such array,
 * an empty array is returned.
 */
StormpathUIRouterTransition.prototype.authorities = function authorities() {
  var toState = this.toState();

  if (toState.data && toState.data.authorities) {
    return toState.data.authorities;
  }

  return [];
};

/**
 * @ngdoc method
 * @name fromState
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {State} State definition for state from which the transition is occurring
 *
 * @description
 * Returns the state definition object for the state currently being transitioned
 * from. This is a wrapper to provide uniform access to both UI Router 0.*.* and
 * UI router 1.*.* state.
 */
StormpathUIRouterTransition.prototype.fromState = function fromState() {
  return this.$fromState || this.$trans.from();
};

/**
 * @ngdoc method
 * @name fromParams
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Object} Parameters of the state currently being transitioned from
 *
 * @description
 * Returns the state parameters for the state currently being transitioned
 * from. This is a wrapper to provide uniform access to both UI Router 0.*.* and
 * UI router 1.*.* state parameters.
 */
StormpathUIRouterTransition.prototype.fromParams = function fromParams() {
  return this.$fromParams || this.$trans.params('from');
};

/**
 * @ngdoc method
 * @name toState
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {State} State definition for state to which the transition is occurring
 *
 * @description
 * Returns the state definition object for the state currently being transitioned
 * to. This is a wrapper to provide uniform access to both UI Router 0.*.* and
 * UI router 1.*.* state.
 */
StormpathUIRouterTransition.prototype.toState = function toState() {
  return this.$toState || this.$trans.to();
};

/**
 * @ngdoc method
 * @name toParams
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Object} Parameters of the state currently being transitioned to
 *
 * @description
 * Returns the state parameters for the state currently being transitioned
 * to. This is a wrapper to provide uniform access to both UI Router 0.*.* and
 * UI router 1.*.* state parameters.
 */
StormpathUIRouterTransition.prototype.toParams = function toParams() {
  return this.$toParams || this.$trans.params();
};

/**
 * @ngdoc method
 * @name pause
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @returns {Boolean} Always `false`
 *
 * @description
 * Prevents the current transition from happening. This actually only does so
 * for UIRouter 0.*.*. For UIRouter 1.*.*, the resolution is promise-based and
 * will not resolve when a promise is returned until that promise does.
 *
 * Returns `false` as a helper for UIRouter 1.*.* - in it, when `false` is returned,
 * the transition is prevented.
 */
StormpathUIRouterTransition.prototype.pause = function pause() {
  if (this.isLegacy()) {
    this.$event.preventDefault();
  }

  return false;
};

/**
 * @ngdoc method
 * @name resume
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @description
 * Continues the transition to the original target state, if prevented. Otherwise
 * a noop.
 */
StormpathUIRouterTransition.prototype.resume = function resume() {
  this.redirect(this.toState(), this.toParams());
};

/**
 * @ngdoc method
 * @name redirect
 * @methodOf stormpath.ui.router:StormpathUIRouterTransition
 *
 * @param {State|String} state State definition or state name
 * @param {Object} params State parameters
 *
 * @description
 * Performs a transition to a given state with the given parameters. A wrapper
 * around UIRouter's `$state.go`.
 */
StormpathUIRouterTransition.prototype.redirect = function redirect(state, params) {
  return this.$state.go(state.name || state, params);
};


/**
 * @ngdoc service
 * @name stormpath.ui.router:StormpathUIRouter
 *
 * @requires $rootScope
 * @requires stormpath.userService.$user:$user
 * @requires stormpath.STORMPATH_CONFIG:STORMPATH_CONFIG
 *
 * @description
 * A wrapper around UI Router that allows Stormpath to connect to state transitions
 * and perform authentication, authorization and redirection.
 *
 * Emits {@link stormpath.ui.router:StormpathUIRouter#events_$stateChangeUnauthorized $stateChangeUnauthorized}
 * or {@link stormpath.ui.router:StormpathUIRouter#events_$stateChangeUnauthenticated $stateChangeUnauthenticated}
 * in case of authorization or authentication failure, to allow for further client handling.
 *
 * When initialized, {@link stormpath.ui.router:StormpathUIRouter#methods_registerUIRouterInternals StormpathUIRouter.registerUIRouterInternals()}
 * <b>must</b> be called to inject `$state` and `$transitions` (if UIRouter >= 1.0.0) into the service.
 */
function StormpathUIRouter($rootScope, $user, STORMPATH_CONFIG) {
  this.$rootScope = $rootScope;
  this.$user = $user;
  this.STORMPATH_CONFIG = STORMPATH_CONFIG;
}

/**
 * @ngdoc metod
 * @name registerUIRouterInternals
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {TransitionsService} $transitions UIRouter 1.*.* `$transitions` service. If undefined, UIRouter 0.*.* is assumed
 * @param {StateService} $state UIRouter `$state` service
 * @returns {StormpathUIRouter} This instance, to allow for chaining.
 *
 * @description
 * Anguiar UIRouter services are passed to this method to allow for them to be used
 * if and only if UIRouter is the routing system being used.
 *
 * This method <b>must</b> be called if UIRouter is used (but the client code should not
 * have to do so), and when called, at least `$state` must be defined.
 */
StormpathUIRouter.prototype.registerUIRouterInternals = function registerInternals($transitions, $state) {
  this.$transitions = $transitions;
  this.$state = $state;
  return this;
};

/**
 * @ngdoc method
 * @name isLegacy
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @returns {Boolean} Whether this is UI Router < 1.0.0
 *
 * @description
 * Checks whether the version of UIRouter being used is 0.*.*
 */
StormpathUIRouter.prototype.isLegacy = function isLegacy() {
  return typeof this.$transitions === 'undefined';
};

/**
 * @ngdoc method
 * @name authorizeStateConfig
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {StormpathUIRouterTransition} transition Current transition
 * @returns {Boolean} Is the user authorized to make this state transition
 *
 * @description
 * Checks whether the user has the proper authorization to make the current
 * transition to the target state. Does so by reading the state configuration's
 * `sp.authorize` or `data.authorities` permitted role arrays.
 */
StormpathUIRouter.prototype.authorizeStateConfig = function authorizeStateConfig(transition) {
  var sp = transition.sp();
  var authorities = sp.authorities();

  if (sp && sp.authorize && sp.authorize.group) {
    return this.$user.currentUser.inGroup(sp.authorize.group);
  } else if (authorities.length) {
    // add support for reading from JHipster's data: { authorities: ['ROLE_ADMIN'] }
    // https://github.com/stormpath/stormpath-sdk-angularjs/issues/190
    var roles = authorities.filter(function(authority) {
      return this.$user.currentUser.inGroup(authority);
    });
    return roles.length > 0;
  }

  console.error('Unknown authorize configuration for spStateConfig', spStateConfig);
  return false;
};

/**
 * @ngdoc method
 * @name onStateChange
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {StormpathUIRouterTransition} transition Current state transition
 *
 * @description
 * Performs required checks and possibly redirects when transitioning to a state.
 * The possible operations are:
 *
 * <ul>
 *  <li>
 *    Redirects to login state if the user is not logged in and the target state
 *    requires authorization.
 *  </li>
 *  <li>
 *    Prevents a state transition if the target state requires some role and the
 *    user does not have this role.
 *  </li>
 *  <li>
 *    Ensures that a user object will be present (either by loading it or requiring
 *    a login) if the state is marked with `sp.waitForUser: true` .
 *  </li>
 *  <li>
 *    Redirects the user back to the default post-login state if this state is
 *    defined, and the user is trying to access the login state while authorized.
 *  </li>
 * </ul>
 *
 * If none of these conditions apply, the handler does not modify the transition.
 */
StormpathUIRouter.prototype.onStateChange = function onStateChange(transition) {
  var self = this;
  var sp = transition.sp();
  var authorities = transition.authorities();
  var needsAuth = sp.authenticate
    || sp.authorize
    || authorities.length;

  if (needsAuth && !this.$user.currentUser) {
    transition.pause();

    return this.$user.get().then(function() {
      // The user is authenticated, continue to the requested state
      if (sp.authorize || authorities.length) {
        if (this.authorizeStateConfig(transition)) {
          return transition.resume();
        }

        self.emitUnauthorized(transition);
        return false;
      }

      return transition.resume();
    }).catch(function() {
      self.emitUnauthenticated(transition);
      return false;
    });
  }else if (sp.waitForUser && (this.$user.currentUser===null)) {
    transition.pause();

    return this.$user.get().finally(function() {
      return transition.resume();
    });
  } else if (this.$user.currentUser && (sp.authorize || authorities.length)) {
    if (!this.authorizeStateConfig(transition)) {
      this.emitUnauthorized(transition);
      return transition.pause();
    }
  } else if (transition.toState().name === this.config.loginState) {
    /*
      If the user is already logged in, we will redirect
      away from the login page and send the user to the
      post login state.
      */
    if (this.$user.currentUser !== false) {
      transition.pause();

      return this.$user.get().finally(function() {
        if (self.$user.currentUser && self.$user.currentUser.href) {
          return transition.redirect(self.config.defaultPostLoginState, {});
        }

        return transition.resume();
      });
    }
  }
};

/**
 * @ngdoc method
 * @name registerInterceptor
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {Object} config Stormpath UI router configuration
 *
 * @description
 * Registers the UI Router interceptor to listen to state change events.
 * Abstracts the operation's differences between UI Router 0.*.* and 1.*.*.
 * The registered method is
 * {@link stormpath.ui.router:StormpathUIRouter#onStateChange StormpathUIRouter.onStateChange()}.
 */
StormpathUIRouter.prototype.registerInterceptor = function registerInterceptor(config) {
  var self = this;
  this.config = config;

  if (this.isLegacy()) {
    return this.$rootScope.$on('$stateChangeStart', function() {
      self.onStateChange(new StormpathUIRouterTransition(self.$state, arguments));
    });
  }

  this.$transitions.onStart({}, function() {
    self.onStateChange(new StormpathUIRouterTransition(self.$state, arguments));
  });
};

/**
 * @ngdoc method
 * @name emitUnauthorized
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {StormpathUIRouterTransition} transition Current state transition
 *
 * @description
 * Emits the {@link stormpath.ui.router:StormpathUIRouter#$stateChangeUnauthorized $stateChangeUnauthorized}
 * event with the data about the target state to signify that the transition failed due to the user not
 * being authorized.
 */
StormpathUIRouter.prototype.emitUnauthorized = function emitUnauthorized(transition) {
  /**
   * @ngdoc event
   * @name stormpath.ui.router:StormpathUIRouter#$stateChangeUnauthorized
   *
   * @eventOf stormpath.ui.router:StormpathUIRouter
   *
   * @eventType broadcast on root scope
   *
   * @param {Object} event
   *
   * Angular event object.
   *
   * @param {Object} toState The state that the user attempted to access.
   *
   * @param {Object} toParams The state params of the state that the user
   * attempted to access.
   *
   * @description
   *
   * This event is broadcast when a UI state change is prevented,
   * because the user is not authorized by the rules defined in the
   * {@link stormpath.SpStateConfig:SpStateConfig Stormpath State Configuration}
   * for the requested state.
   *
   * Use this event if you want to implement your own strategy for telling
   * the user that they are forbidden from viewing that state.
   *
   * To receive this event, you must be using the UI Router integration.
   *
   * @example
   *
   * <pre>
   *   $rootScope.$on('$stateChangeUnauthorized',function(e,toState,toParams){
   *     // Your custom logic for deciding how the user should be
   *     // notified that they are forbidden from this state
   *   });
   * </pre>
   */
  this.$rootScope.$broadcast(
    this.STORMPATH_CONFIG.STATE_CHANGE_UNAUTHORIZED,
    transition.toState(),
    transition.toParams()
  );
};

/**
 * @ngdoc method
 * @name emitUnauthenticated
 * @methodOf stormpath.ui.router:StormpathUIRouter
 *
 * @param {StormpathUIRouterTransition} transition Current state transition
 *
 * @description
 * Emits the {@link stormpath.ui.router:StormpathUIRouter#$stateChangeUnauthenticated $stateChangeUnauthenticated}
 * event with the data about the target state to signify that the transition failed due to the user not
 * being authenticated (i.e. having the permissions to access this route).
 */
StormpathUIRouter.prototype.emitUnauthenticated = function emitUnauthenticated(transition) {
  /**
   * @ngdoc event
   *
   * @name stormpath.ui.router:StormpathUIRouter#$stateChangeUnauthenticated
   *
   * @eventOf stormpath.ui.router:StormpathUIRouter
   *
   * @eventType broadcast on root scope
   *
   * @param {Object} event
   *
   * Angular event object.
   *
   * @param {Object} toState The state that the user attempted to access.
   *
   * @param {Object} toParams The state params of the state that the user
   * attempted to access.
   *
   * @description
   *
   * This event is broadcast when a UI state change is prevented,
   * because the user is not logged in.
   *
   * Use this event if you want to implement your own strategy for
   * presenting the user with a login form.
   *
   * To receive this event, you must be using the UI Router integration.
   *
   * @example
   *
   * <pre>
   *   $rootScope.$on('$stateChangeUnauthenticated',function(e,toState,toParams){
   *     // Your custom logic for deciding how the user should login, and
   *     // if you want to redirect them to the desired state afterwards
   *   });
   * </pre>
   */
  this.$rootScope.$broadcast(
    this.STORMPATH_CONFIG.STATE_CHANGE_UNAUTHENTICATED,
    transition.toState(),
    transition.toParams()
  );
};

StormpathUIRouter.$inject = ['$rootScope', '$user', 'STORMPATH_CONFIG'];
