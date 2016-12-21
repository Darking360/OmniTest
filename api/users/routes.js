var express    = require('express');
var router = express.Router();
var User = require('./model.js');
var bodyParser = require('body-parser');
var bcrypt   = require('bcrypt-nodejs');
var JWT = require('jwt-async'),
    jwt = new JWT();
jwt.setSecret('omnitest1234');

module.exports = function(app){

  app.use(bodyParser.urlencoded({ extended: true }));
  app.use(bodyParser.json());

  router.route('/signin')

    .post(function(req,res){
      if(typeof req.body.email == 'undefined' || typeof req.body.password == 'undefined'){
        res.json({message: "Please fill email and password to login"})
        return;
      }
      User.findOne({email:req.body.email},function(err,user){
        if (err){
          res.json({message: "Missing user or wrong email, try to type it again"});
          return;
        }
        if(user == null){
          res.json({message: "User doesn't exist"});
          return;
        }
        if(bcrypt.compareSync(req.body.password, user.password)){
          jwt.sign({user: user}, function (err, data) {
            if (err){
              res.json({message : err});
            }
            res.json({message: "Welcome " + user.name + ' ' + user.last_name, auth_token: data  })
          });
        }else{
          res.json({message: "Wrong password"});
        }
      });
    });


  router.route('/signup')
    .post(function(req,res){
      var  user = new User;
      User.findOne({'email':req.body.email}, function(err, user) {
          if(err){
            console.log("Good to go");
          }else if(user != null){
            res.json({message:"Email already in use"});
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
          res.json(err);
          return;
        }
        jwt.sign({user: user}, function (err, data) {
          if (err){
            res.json({message : err});
          }
          res.json({ auth_token: data });
        });
      });
    });


  router.route('/users')
    .get(function(req, res) {
      if(typeof req.headers['authorization'] == 'undefined'){
        res.json({message: "You must login to get JWT and see users"});
        return;
      }
      else{
        var jwt_token = req.headers['authorization']
        jwt.verify(jwt_token, function(err, jwt_data) {
          if(err){
            res.json({message:err});
            return;
          }
          if(typeof jwt_data.claims.user == 'undefined' || (typeof jwt_data.claims.user.email == 'undefined' || typeof jwt_data.claims.user.password == 'undefined'))
            res.json({message: "Invalid JWT or invalid datagram"});
          User.findOne({'email':jwt_data.claims.user.email}, function(err, user) {
              if (err)
                res.json(err);
              User.find(function(err, users) {
                if (err)
                  res.send(err);
                res.json(users);
              });
          });
        });
      }
  });

  router.route('/users/:user_id')

      .get(function(req, res) {
        if(typeof req.headers['authorization'] == 'undefined'){
          res.json({message: "You must login to get JWT and see users"});
          return;
        }
        var jwt_token = req.headers['authorization']
        jwt.verify(jwt_token, function(err, jwt_data) {
          if(err){
            res.json({message:err});
            return;
          }
          User.findOne({ _id : req.params.user_id },function(err,user){
            if(err){
              res.json({message:"User doesn't exist"});
              return;
            }
            if(user == null){
              res.json({message:"User doesn't exist"});
              return;
            }
            response = {
              name: user.name,
              last_name: user.last_name,
              email: user.email
            };
            res.json({user: response});
          });
        });
      })

      .put(function(req, res) {
          if(typeof req.headers['authorization'] == 'undefined'){
            res.json({message: "You must login to get JWT and see users"});
            return;
          }
          var jwt_token = req.headers['authorization'];
          jwt.verify(jwt_token, function(err, jwt_data) {
            if(err){
              res.json({message:err});
              return;
            }
            User.findOne({_id : req.params.user_id}, function(err, user) {
                console.log();
                if(err){
                  res.send(err);
                  return;
                }
                if(user == null){
                  res.json({message:"User doesn't exist"});
                  return;
                }
                if(user.email != jwt_data.claims.user.email){
                  res.json({message : "You don't have permissions to edit this user" });
                  return;
                }
                user.name = req.body.name || user.name;
                user.last_name = req.body.last_name || user.last_name;
                user.email = req.body.email || user.email;
                user.password = req.body.password || user.password;
                user.save(function(err) {
                    if(err){
                      res.json({message:err});
                      return;
                    }
                    res.json({ message: 'User updated!' });
                });
            });
          });
      })

      .delete(function(req,res){
          if(typeof req.headers['authorization'] == 'undefined'){
            res.json({message: "You must login to get JWT and see users"});
            return;
          }
          var jwt_token = req.headers['authorization']
          jwt.verify(jwt_token, function(err, jwt_data) {
            if(err){
              res.json({message:err});
              return;
            }
            User.findOne({ _id : req.params.user_id }, function(err,user){
              if(err){
                res.json({message:err});
                return;
              }
              if(user == null){
                res.json({message : "User doesn't exist" });
                return;
              }
              if(jwt_data.claims.user.email != user.email){
                res.json({message : "You don't have permissions to delete this user" });
                return;
              }
              user.remove(function(err){
                if(err){
                  res.json({message:err});
                  return;
                }
                res.json({message : "User deleted" });
              });
            });
          });
      });

      app.use('/api', router);

};
