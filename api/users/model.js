var mongoose = require('mongoose'); //Mongoose in order to comunicate with MongoDB
var bcrypt   = require('bcrypt-nodejs'); //Encrypt passwords
var autoIncrement = require('mongoose-auto-increment'); //Numeric auto-increment field for records

var connection = mongoose.connect('mongodb://localhost:27017'); //Connecting to LOCAL MongoDB
autoIncrement.initialize(connection); //Initializing increment on _id

var UserSchema = mongoose.Schema({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  name: { type: String, required: true },
  last_name: { type: String, required: true }
});

//Binding plugin to UserSchema
UserSchema.plugin(autoIncrement.plugin, 'User');
var User = connection.model('User', UserSchema);


//Encrypt password whenever saving a user to DB (create, update, save)
UserSchema.pre('save', function(next) {
    var user = this;
    //Only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    user.password = bcrypt.hashSync(user.password);

    console.log("Pass hashed");

    next();

});

module.exports = mongoose.model('User', UserSchema);
