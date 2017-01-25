'use strict';

/**
* @ngdoc overview
*
* @name stormpath.ui-router
*
* @description
*
* This module provides the {@link stormpath.ui-router.StormpathUIRouter StormpathUIRouter}
* service, which handles Stormpath's integration with UIRouter (both 0.*.* and 1.**).
*/
angular
  .module('stormpath.ui-router', ['stormpath.userService'])
  .service('StormpathUIRouter', StormpathUIRouter);

/**
 * @private
 * @name stormpath.ui-router.StormpathUIRouterTransition
 * @description
 *
 * Encapsulates UIRouter state transitions for both versions 0.*.* and 1.*.*
 * Expects UIRouter's `$state` as the first argument, and the transition start
 * `arguments` as the second argument. It provides normalised access to the
 * standard state transition manually.
 *
 * Should <b>never</b> be instantiated in client code. This class is meant only
 * for private use in the {@link stormpath.ui-router.StormpathUIRouter StormpathUIRouter}
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.isLegacy
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.sp
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.authorities
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.fromState
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.fromParams
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.toState
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.toParams
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.pause
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.resume
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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
 * @name stormpath.ui-router.StormpathUIRouterTransition.redirect
 * @methodOf stormpath.ui-router.StormpathUIRouterTransition
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

function StormpathUIRouter($rootScope, $user, STORMPATH_CONFIG) {
  this.$rootScope = $rootScope;
  this.$user = $user;
  this.STORMPATH_CONFIG = STORMPATH_CONFIG;
}

StormpathUIRouter.prototype.registerUIRouterInternals = function registerInternals($transitions, $state) {
  this.$transitions = $transitions;
  this.$state = $state;
  return this;
};


StormpathUIRouter.prototype.isLegacy = function isLegacy() {
  return typeof this.$transitions === 'undefined';
};

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
  }else if (transition.toState().name === this.config.loginState) {
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

StormpathUIRouter.prototype.emitUnauthorized = function emitUnauthorized(transition) {
  /**
   * @ngdoc event
   *
   * @name stormpath.$stormpath#$stateChangeUnauthorized
   *
   * @eventOf stormpath.$stormpath
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

StormpathUIRouter.prototype.emitUnauthenticated = function emitUnauthenticated(transition) {
  /**
   * @ngdoc event
   *
   * @name stormpath.$stormpath#$stateChangeUnauthenticated
   *
   * @eventOf stormpath.$stormpath
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
