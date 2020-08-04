const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new mongoose.Schema({
  firstname: {
    type: String,
    required: true,
  },
  lastname: {
    type: String,
    required: true,
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
  bio: {
    type: String,
  },
  profilePicture: {
    type: String,
  },
  resume: {
    type: String,
  },
  posts: [
    {
      type: Schema.Types.ObjectId,
      ref: 'post',
    },
  ],
  streetAddress: {
    type: String,
  },
  state: {
    type: Schema.Types.ObjectId,
    ref: 'state',
  },
  status: {
    type: String,
    required: true,
    enum: ['Active', 'Disabled'],
  },
  tags: [
    {
      type: Schema.Types.ObjectId,
      ref: 'tag',
    },
  ],
});

module.exports = User = mongoose.model('user', UserSchema);
