/**
 * Main application file
 */

'use strict';

// Set default node environment to development
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var express = require('express');
var config = require('./config/environment');
var ExpressStormpath = require('express-stormpath');
var path = require('path');
// Setup server
var app = express();

var server = require('http').createServer(app);

/*
  The config/express file is setting up the static file server which serves your
  angular application assets.  We don't need to authenticate those requests, so
  we do this before calling Stormpath.
 */

require('./config/express')(app);

console.log('Initializing Stormpath');

/*
  Now we initialize Stormpath, any middleware that is registered after this
  point will be protected by Stormpath.

  The spa setting tells the Stormpath library where your Angular app is,
  as it will need to serve it for the default routes like /login and
  /register.  The appPath property is provided by the configuration parser
  in the Yeoman boilerplate.
 */

app.use(ExpressStormpath.init(app,{
  web: {
    produces: ['application/json'],
    spa: {
      enabled: true,
      view: app.get('appPath')
    }
  }
}));


require('./routes')(app);

app.on('stormpath.ready',function() {

  console.log('Stormpath Ready');

  // Start server
  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
});

// Expose app
exports = module.exports = app;
