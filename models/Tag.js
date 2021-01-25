const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  posted: {
    type: Number,
  },
  alertCount: {
    type: Number,
  },
});

module.exports = Tag = mongoose.model('tag', TagSchema);
