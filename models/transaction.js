var mongoose = require("mongoose");

var transactionSchema = new mongoose.Schema({
    transactionId: Number,
    isCompleted: {type: Boolean, default: false},
    status: {type: String, default: "Processing"},
    type: String,
    name: String,
    amount: {type: Number, min: 15},
    rate: Number,
    payable: Number,
    author: {
      id: {
         type: mongoose.Schema.Types.ObjectId,
         ref: "User"
      },
      firstName: String,
      phone: Number,
      email: String,
    },
    account: String,
    date: {type: Date, default: Date.now()}
});

module.exports = mongoose.model("Transaction", transactionSchema);