# Stormpath Angular + Express + CORS

This folder contains an example application that is built with the
[Stormpath Angular SDK][] and [Stormpath Express][].

This example shows you how to host your Angular application on a different
domain from your API service.

#### Running the Example Application

1. To run this application, you will need Bower and Grunt as global packages:

  ```bash
  npm install -g grunt bower
  ```

2. Clone this repo to your computer, and enter the directory for this example:

  ```bash
  git clone https://github.com/stormpath/stormpath-sdk-angularjs.git
  cd stormpath-sdk-angularjs/example/cors-app
  ```

3. Install the dependencies:

  ```bash
  npm install
  bower install
  ```
4. Export your environment variables for your Stormpath Tenant and Application:

  ```bash
  export STORMPATH_CLIENT_APIKEY_ID=xxx
  export STORMPATH_CLIENT_APIKEY_SECRET=xxx
  export STORMPATH_APPLICATION_HREF=xxx
  ```

5. You *may* need to edit your  `/etc/hosts` file to create aliases for localhost,
   if so you would add these lines to it:

   ```
   127.0.0.1  a.localhost
   127.0.0.1  b.localhost
   ```

5. Start the server with the node command:

  ```bash
  node server.js
  ```

  When the Stormpath client is ready, the website http://a.localhost:3000 will
  be opened in your Browser.  It will be communicating with your API service
  which is running on http://b.localhost:4000


[Stormpath Angular SDK]: https://github.com/stormpath/stormpath-sdk-angularjs
[Stormpath Express]: https://github.com/stormpath/stormpath-express
[Yeoman Guide]: https://docs.stormpath.com/angularjs/guide
