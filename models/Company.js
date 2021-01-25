const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CompanySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Disabled', 'Pending'],
  },
  description: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  streetAddress: {
    type: String,
  },
  state: {
    type: String,
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'post',
    },
  ],
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: 'tag',
    },
  ],
  subscribers: {
    type: Number,
  },
});

module.exports = Company = mongoose.model('company', CompanySchema);
