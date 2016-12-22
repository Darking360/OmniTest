//Importing dependencies and objects in order to manipulate user's routes and export them to main app.js
var express    = require('express');
var router = express.Router();
var User = require('./model.js');
var bodyParser = require('body-parser');
var bcrypt   = require('bcrypt-nodejs');
var JWT = require('jwt-async'),
    jwt = new JWT();
jwt.setSecret('omnitest1234');

module.exports = function(app){

  //Allows to read data from the request
  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  router.route('/signin')

    /** /api/signin
      * In order to login the user, we ask for email and password on the body of the request
      * And then find the user and compares the password from request, if succeed, return JWT with user data
      * Method: POST
    **/
    .post(function(req,res){
      if(typeof req.body.email == 'undefined' || typeof req.body.password == 'undefined'){
        res.json({status:400,message: "Please fill email and password to login"})
        return;
      }
      User.findOne({email:req.body.email},function(err,user){
        if (err){
          res.json({status:400,message: "Missing user or wrong email, try to type it again"});
          return;
        }
        if(user == null){
          res.json({status:404,message: "User doesn't exist"});
          return;
        }
        if(bcrypt.compareSync(req.body.password, user.password)){
          jwt.sign({user: user}, function (err, data) {
            if (err){
              res.json({status:400,message : err});
            }
            res.json({status:200,message: "Welcome " + user.name + ' ' + user.last_name, auth_token: data  })
          });
        }else{
          res.json({status:401,message: "Wrong password"});
        }
      });
    });


  router.route('/signup')
    /** /api/signup
      * Similar to signin, but in this we create a new user if the email is free to use, check the fields
      * If data is ok and no fields are left in blank, user is created and return a JWT with user data
      * Method: POST
    **/
    .post(function(req,res){
      var  user = new User;
      User.findOne({'email':req.body.email}, function(err, user) {
          if(err){
            console.log("Good to go");
          }else if(user != null){
            res.json({status:400,message:"Email already in use"});
            return;
          }
      });
      var user = new User;
      user.email = req.body.email;
      user.password = req.body.password;
      user.name = req.body.name;
      user.last_name = req.body.last_name;
      user.save(function(err) {
        if (err){
          res.json({status:400,message:err});
          return;
        }
        jwt.sign({user: user}, function (err, data) {
          if (err){
            res.json({status:400,message : err});
          }
          res.json({ status:200, auth_token: data });
        });
      });
    });


  router.route('/users')
    /** /api/users
      * With the correct JWT, this function returns an array with all the users inside the DB
      * Method: GET
    **/
    .get(function(req, res) {
      if(typeof req.headers['authorization'] == 'undefined'){
        res.json({status:401,message: "You must login to get JWT and see users"});
        return;
      }
      else{
        var jwt_token = req.headers['authorization']
        jwt.verify(jwt_token, function(err, jwt_data) {
          if(err){
            res.json({status:400,message:err});
            return;
          }
          if(typeof jwt_data.claims.user == 'undefined' || (typeof jwt_data.claims.user.email == 'undefined' || typeof jwt_data.claims.user.password == 'undefined'))
            res.json({status:401,message: "Invalid JWT or invalid datagram"});
          User.findOne({'email':jwt_data.claims.user.email}, function(err, user) {
              if (err){
                res.json({status:200,message:err});
              }
              User.find(function(err, users) {
                if (err){
                  res.json({status:400,message:err});
                }
                res.json({status:200,users:users});
              });
          });
        });
      }
  });

  router.route('/users/:user_id')
        /** /api/users/:user_id
          * With the correct JWT, returns an object with the user data required
          * Method: GET
        **/
      .get(function(req, res) {
        if(typeof req.headers['authorization'] == 'undefined'){
          res.json({status:401,message: "You must login to get JWT and see users"});
          return;
        }
        var jwt_token = req.headers['authorization']
        jwt.verify(jwt_token, function(err, jwt_data) {
          if(err){
            res.json({status:400,message:err});
            return;
          }
          console.log("ESTA LLEGANDO");
          console.log(req.params);
          User.findOne({ _id : req.params.user_id },function(err,user){
            if(err){
              res.json({status:404,message:"User doesn't exist"});
              return;
            }
            if(user == null){
              res.json({status:404,message:"User doesn't exist"});
              return;
            }
            response = {
              name: user.name,
              last_name: user.last_name,
              email: user.email
            };
            res.json({status:200,user: response});
          });
        });
      })
      /** /api/users/:user_id
        * Only with a JWT that corresponds to the user that wants to be updated
        * When succeed, returns a update message
        * Method: PUT
      **/
      .put(function(req, res) {
          if(typeof req.headers['authorization'] == 'undefined'){
            res.json({status:401,message: "You must login to get JWT and see users"});
            return;
          }
          var jwt_token = req.headers['authorization'];
          jwt.verify(jwt_token, function(err, jwt_data) {
            if(err){
              res.json({status:400,message:err});
              return;
            }
            User.findOne({_id : req.params.user_id}, function(err, user) {
                console.log();
                if(err){
                  res.send(err);
                  return;
                }
                if(user == null){
                  res.json({status:404,message:"User doesn't exist"});
                  return;
                }
                if(user.email != jwt_data.claims.user.email){
                  res.json({status:401,message : "You don't have permissions to edit this user" });
                  return;
                }
                user.name = req.body.name || user.name;
                user.last_name = req.body.last_name || user.last_name;
                user.email = req.body.email || user.email;
                user.password = req.body.password || user.password;
                user.save(function(err) {
                    if(err){
                      res.json({status:400,message:err});
                      return;
                    }
                    res.json({ status:200, message: 'User updated!' });
                });
            });
          });
      })
      /** /api/users/:user_id
        * Only with a JWT that corresponds to the user that wants to be deleted
        * When succeed, returns a deleted message
        * Method: DELETE
      **/
      .delete(function(req,res){
          if(typeof req.headers['authorization'] == 'undefined'){
            res.json({status:401,message: "You must login to get JWT and see users"});
            return;
          }
          var jwt_token = req.headers['authorization']
          jwt.verify(jwt_token, function(err, jwt_data) {
            if(err){
              res.json({status:400,message:err});
              return;
            }
            User.findOne({ _id : req.params.user_id }, function(err,user){
              if(err){
                res.json({status:400,message:err});
                return;
              }
              if(user == null){
                res.json({status:404,message : "User doesn't exist" });
                return;
              }
              if(jwt_data.claims.user.email != user.email){
                res.json({status:401,message : "You don't have permissions to delete this user" });
                return;
              }
              user.remove(function(err){
                if(err){
                  res.json({status:400,message:err});
                  return;
                }
                res.json({status:200,message : "User deleted" });
              });
            });
          });
      });

      app.use('/api', router);

};
