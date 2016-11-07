'use strict';

/**
 * This module and factory are intentionally excluded from NG Docs.
 *
 * The factory is an internal utility used to check whether an URL is on the
 * same domain on which the SPA is hosted.
 */

angular.module('stormpath.domainUtils', [])
.factory('$isCurrentDomain', ['$window', function($window) {
  return function(url) {
    var link = $window.document.createElement('a');
    link.href = url;

    return $window.location.host === link.host;
  };
}]);
