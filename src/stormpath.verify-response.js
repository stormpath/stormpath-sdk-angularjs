'use strict';

/**
* @ngdoc overview
*
* @name stormpath.util
*
* @description
* This module provides general utility functions.
*/

/**
* @ngdoc object
*
* @name stormpath.util.$verifyResponse
*
* @description
* A factory that creates a {@link stormpath.util.$verifyResponse#$verifyResponse $verifyResponse}
* function.
*/
angular.module('stormpath.util', [])
.factory('$verifyResponse', function() {
  /**
  * @ngdoc function
  *
  * @name stormpath.util.$verifyResponse#$verifyResponse
  * @methodOf stormpath.util.$verifyResponse
  *
  * @param {Object} response The response returned from a $http.get() request
  * @returns {Object} Object containing the validation result. It has a boolean field `value`
  * that is true if the request passes validation, and otherwise false. If validate is false,
  * it will return an error field, containing an object with the error message in `retVal.error.message`
  *
  * @description
  * Checks whether the response has a valid format. Currently, to be valid, it
  * has to be a well-formed response and have the 'application/json' content type.
  */
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
