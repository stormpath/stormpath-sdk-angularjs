'use strict';

/**
 * This module and factory are intentionally excluded from NG Docs.
 *
 * The factory is an internal utility used to check whether an URL is on the
 * same domain on which the SPA is hosted.
 */

angular.module('stormpath.utils', ['stormpath.CONFIG'])
.factory('$isCurrentDomain', ['$window', function($window) {
  return function(url) {
    var link = $window.document.createElement('a');
    link.href = url;

    return (link.host === "") || $window.location.host === link.host.replace(/:443$/, "");
  };
}])
.constant('$spHeaders', {
  // The placeholders in the value are replaced by the `grunt dist` command.
  'X-Stormpath-Agent': '@@PACKAGE_NAME/@@PACKAGE_VERSION' + ' angularjs/' + angular.version.full
})
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
}])
.provider('$spFormEncoder', [function $spFormEncoder(){
  /**
   * This service is intentionally excluded from NG Docs.
   * It is an internal utility.
   */

  this.$get = [
    function formEncoderServiceFactory(){

      function FormEncoderService(){
        var encoder = new UrlEncodedFormParser();
        this.encodeUrlForm = encoder.encode.bind(encoder);
        return this;
      }

      FormEncoderService.prototype.formPost = function formPost(httpRequest){
        var h = httpRequest.headers ? httpRequest.headers : (httpRequest.headers = {});
        h['Content-Type'] = 'application/x-www-form-urlencoded';
        httpRequest.data = this.encodeUrlForm(httpRequest.data);
        return httpRequest;
      };

      function UrlEncodedFormParser(){

        // Copy & modify from https://github.com/hapijs/qs/blob/master/lib/stringify.js

        this.delimiter = '&';
        this.arrayPrefixGenerators = {
          brackets: function (prefix) {
            return prefix + '[]';
          },
          indices: function (prefix, key) {
            return prefix + '[' + key + ']';
          },
          repeat: function (prefix) {
            return prefix;
          }
        };
        return this;
      }
      UrlEncodedFormParser.prototype.stringify = function stringify(obj, prefix, generateArrayPrefix) {

        if (obj instanceof Date) {
          obj = obj.toISOString();
        }
        else if (obj === null) {
          obj = '';
        }

        if (typeof obj === 'string' ||
          typeof obj === 'number' ||
          typeof obj === 'boolean') {

          return [encodeURIComponent(prefix) + '=' + encodeURIComponent(obj)];
        }

        var values = [];

        if (typeof obj === 'undefined') {
          return values;
        }

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          if (Array.isArray(obj)) {
            values = values.concat(this.stringify(obj[key], generateArrayPrefix(prefix, key), generateArrayPrefix));
          }
          else {
            values = values.concat(this.stringify(obj[key], prefix + '[' + key + ']', generateArrayPrefix));
          }
        }

        return values;
      };
      UrlEncodedFormParser.prototype.encode = function encode(obj, options) {

        options = options || {};
        var delimiter = typeof options.delimiter === 'undefined' ? this.delimiter : options.delimiter;

        var keys = [];

        if (typeof obj !== 'object' ||
          obj === null) {

          return '';
        }

        var arrayFormat;
        if (options.arrayFormat in this.arrayPrefixGenerators) {
          arrayFormat = options.arrayFormat;
        }
        else if ('indices' in options) {
          arrayFormat = options.indices ? 'indices' : 'repeat';
        }
        else {
          arrayFormat = 'indices';
        }

        var generateArrayPrefix = this.arrayPrefixGenerators[arrayFormat];

        var objKeys = Object.keys(obj);
        for (var i = 0, il = objKeys.length; i < il; ++i) {
          var key = objKeys[i];
          keys = keys.concat(this.stringify(obj[key], key, generateArrayPrefix));
        }

        return keys.join(delimiter);
      };

      return new FormEncoderService();
    }
  ];
}])
/**
* Intentionally excluded from the NG Docs.
*
* Shallow-transforms snake-cased keys in an object into camelCased keys
*/
.factory('$normalizeObjectKeys', function() {
  return function normalizeObjectKeys(obj) {
    var camelCasedObj = {};

    Object.keys(obj).forEach(function(key) {
      if (obj.hasOwnProperty(key)) {
        var camelCasedKey = key.replace(/_([A-Za-z])/g, function(all, char) {
          return char.toUpperCase();
        });

        camelCasedObj[camelCasedKey] = obj[key];
      }
    });

    return camelCasedObj;
  };
})

.factory('$encodeQueryParams', function() {
  return function encodeQueryParams(obj) {
    if (!angular.isObject(obj)) {
      return '';
    }

    var query = Object.keys(obj).map(function(key) {
      return encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]);
    }).join('&');

    return query ? ('?' + query) : query;
  };
})

.factory('$decodeQueryParams', function() {
  return function decodeQueryParams(str) {
    if (!angular.isString(str) || str.length === 0) {
      return {};
    }

    var params = {};

    str.substr(1).split('&').forEach(function(pair) {
      var parts = pair.split('=');
      params[decodeURIComponent(parts[0])] = decodeURIComponent(parts[1]);
    });

    return params;
  };
})

.factory('$parseUrl', ['$decodeQueryParams', function($decodeQueryParams) {
  return function parseUrl(url) {
    var parser = document.createElement('a');
    parser.href = url;

    return {
      protocol: parser.protocol,
      hash: parser.hash,
      host: parser.hostname,
      port: parser.port,
      pathname: parser.pathname,
      query: parser.search,
      search: $decodeQueryParams(parser.search)
    };
  };
}])

.factory('$getLocalUrl', ['$location', '$parseUrl', function($location, $parseUrl) {

  return function(uri) {
    if (uri && uri.charAt(0) !== '/') {
      var parsedUri = $parseUrl(uri);
      uri = parsedUri.pathname + parsedUri.query + parsedUri.hash;
    }

    return $location.protocol()
      + '://'
      + $location.host()
      + ($location.port() ? (':' + $location.port()) : '')
      + uri;

  };
}]);
