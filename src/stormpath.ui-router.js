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

StormpathUIRouterTransition.prototype.isLegacy = function isLegacy() {
  return typeof this.$trans === 'undefined';
};

StormpathUIRouterTransition.prototype.sp = function sp() {
  return this.toState().sp || {};
};

StormpathUIRouterTransition.prototype.authorities = function authorities() {
  var toState = this.toState();

  if (toState.data && toState.data.authorities) {
    return toState.data.authorities;
  }
};

StormpathUIRouterTransition.prototype.fromState = function fromState() {
  return this.$fromState || this.$trans.from();
};

StormpathUIRouterTransition.prototype.fromParams = function fromParams() {
  return this.$fromParams || this.$trans.params('from');
};

StormpathUIRouterTransition.prototype.toState = function toState() {
  return this.$toState || this.$trans.to();
};

StormpathUIRouterTransition.prototype.toParams = function toParams() {
  return this.$toParams || this.$trans.params();
};

StormpathUIRouterTransition.prototype.pause = function pause() {
  if (this.isLegacy()) {
    this.$event.preventDefault();
  }

  return false;
};

StormpathUIRouterTransition.prototype.resume = function resume() {
  this.redirect(this.toState(), this.toParams());
};

StormpathUIRouterTransition.prototype.undo = function undo() {
  if (this.isLegacy()) {
    return this.$event.preventDefault();
  }

  var origin = this.makeTargetState(this.fromState(), this.fromParams());
  return this.$trans.redirect(origin);
};

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
  } else if (authorities) {
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
    || (authorities && authorities.length);

  if (needsAuth && !this.$user.currentUser) {
    transition.pause();

    return this.$user.get().then(function() {
      // The user is authenticated, continue to the requested state
      if (sp.authorize || (authorities && authorities.length)) {
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
  } else if (this.$user.currentUser && (sp.authorize || (authorities && authorities.length))) {
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

angular
  .module('stormpath.ui-router', ['stormpath.userService'])
  .service('StormpathUIRouter', StormpathUIRouter);
