var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");


var userSchema = new mongoose.Schema({
    username: String,
    firstName: String,
    email: String,
    password: String,
    phone: Number,
    transactions: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Transaction"
            }
        ],
    resetToken: String,
    isAdmin: {type: Boolean, default: false}
});

userSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", userSchema);
