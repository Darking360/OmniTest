'use strict';

var SwaggerExpress = require('swagger-express-mw');
var app = require('express')();
require('./api/users/routes.js')(app);
module.export = app;

var config = {
  appRoot: __dirname //Config
};

SwaggerExpress.create(config, function(err, swaggerExpress) {
  if (err) { throw err; }
  //Install middleware
  swaggerExpress.register(app);

  var port = 3000;
  app.listen(port);
  console.log('Magic happens on port ' + port);
});