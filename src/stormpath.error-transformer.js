'use strict';

angular.module('stormpath')
.provider('$spErrorTransformer', [function $spErrorTransformer(){
  /**
   * This service is intentionally excluded from NG Docs.
   *
   * It is an internal utility for producing error objects from $http response
   * errors.
   */

  this.$get = [
    function formEncoderServiceFactory(){

      function ErrorTransformerService(){

      }

      ErrorTransformerService.prototype.transformError = function transformError(httpResponse){
        var errorMessage = null;

        if (httpResponse.data) {
          errorMessage = httpResponse.data.message || httpResponse.data.error;
        }

        if (!errorMessage) {
          errorMessage = 'An error occured when communicating with the server.';
        }

        var error = new Error(errorMessage);

        error.httpResponse = httpResponse;
        error.statusCode = httpResponse.status;
        return error;
      };

      return new ErrorTransformerService();
    }
  ];
}]);