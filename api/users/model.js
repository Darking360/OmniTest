var mongoose = require('mongoose');
var bcrypt   = require('bcrypt-nodejs');
var autoIncrement = require('mongoose-auto-increment');

var connection = mongoose.connect('mongodb://localhost:27017');
autoIncrement.initialize(connection);

var UserSchema = mongoose.Schema({
  email: { type: String, required: true, index: { unique: true } },
  password: { type: String, required: true },
  name: { type: String, required: true },
  last_name: { type: String, required: true }
});

UserSchema.plugin(autoIncrement.plugin, 'User');
var User = connection.model('User', UserSchema);

UserSchema.pre('save', function(next) {
    var user = this;

    // only hash the password if it has been modified (or is new)
    if (!user.isModified('password')) return next();

    user.password = bcrypt.hashSync(user.password);

    console.log("Pass hashed");

    next();

});

module.exports = mongoose.model('User', UserSchema);
