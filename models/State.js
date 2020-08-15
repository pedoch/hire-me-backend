const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const StateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
});

module.exports = State = mongoose.model("state", StateSchema);
