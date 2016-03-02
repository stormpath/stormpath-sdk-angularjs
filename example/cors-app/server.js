var cors = require('cors');
var express = require('express');
var stormpath = require('express-stormpath');
var open = require('open');
var path = require('path');

/*
  The websiteService is a naive Express app, it's only
  purpose is to serve the assets for our Angular application
 */

var websiteDomain = 'http://a.localhost:3000';

var websiteService = express();

websiteService.use('/',express.static(path.join(__dirname,'client')));

websiteService.listen(3000,function () {
  open(websiteDomain);  // Opens the Angular app in your browser
});

/*
  The apiService is your API that you want to protect with
  Stormpath.  We use the CORS module to whitelist the website
  domain, thus allowing it to communicate with the API domain
 */

var apiService = express();

apiService.use(cors({
  origin: websiteDomain,
  credentials: true
}));

apiService.use(stormpath.init(apiService,{ }));

/*
  We use the loginRequired middleware, as that will assert
  that the Angular client has authenticated and has valid
  OAuth tokens in the cookies that were stpored on the API domain
 */

apiService.get('/api/thing', stormpath.loginRequired, function (req,res) {
  res.json(req.user);
});

apiService.on('stormpath.ready',function() {
  apiService.listen(4000);
});