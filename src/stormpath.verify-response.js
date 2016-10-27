'use strict';

angular.module('stormpath.util', [])
.factory('$verifyResponse', function() {
  return function verifyResponse(response) {
    if (!response || typeof response.headers !== 'function') {
      return {
        valid: false,
        error: {
          message: 'Invalid response object format'
        }
      };
    }

    var contentType = response.headers('Content-Type');

    if (!contentType.startsWith('application/json')) {
      return {
        valid: false,
        error: {
          message: 'Incorrect current user API endpoint response content type: ' + contentType
        }
      };
    }

    return {
      valid: true
    };
  };
});
