var mongoose = require("mongoose");

var rateSchema = new mongoose.Schema({
    pmbuy: Number,
    pmsell: Number,
    payeerbuy: Number,
    payeersell: Number,
    advbuy: Number,
    advsell: Number,
    paypalbuy: Number,
    paypalsell: Number,
    isUpdated: {type: Boolean, default: true},
    lastUpdated: {type: Date, default: Date.now()}
});

module.exports = new mongoose.model("Rates", rateSchema);