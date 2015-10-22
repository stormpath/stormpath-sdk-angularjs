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

/*
  Now we initialize Stormpath, any middleware that is registered after this
  point will be protected by Stormpath.
 */

app.use(ExpressStormpath.init(app,{
  website: true,
  web: {
    spaRoot: path.join(__dirname, '..','client','index.html')
  }
}));


require('./routes')(app);

app.on('stormpath.ready',function() {
  // Start server
  server.listen(config.port, config.ip, function () {
    console.log('Express server listening on %d, in %s mode', config.port, app.get('env'));
  });
});

// Expose app
exports = module.exports = app;