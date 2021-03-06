'use strict';
//Importing all dependencies, live-reload with swagger and also documentation
var SwaggerExpress = require('swagger-express-mw');
var SwaggerUi = require('swagger-tools/middleware/swagger-ui');
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
  app.use(SwaggerUi(swaggerExpress.runner.swagger));

  //Listening on port 3000. localhost:3000
  var port = 3000;
  app.listen(port);
  console.log('Magic happens on port ' + port);
});
