const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
    username: {type: String, required: true},
    email: {type: String, unique: true, required: true},
    password: { type: String, required: true }, 
    chats: [String],
    profilepicurl: String   
});

UserSchema.methods.generateAuthToken = function(){ 
    const token = jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn: '6h'}); 
    return token;
}

const UserModel = mongoose.model('users', UserSchema);

module.exports = {UserModel};