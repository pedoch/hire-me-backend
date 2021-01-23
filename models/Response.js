const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResponseSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'user',
    required: true,
  },
  alternativeResume: {
    type: String,
  },
  skills: [
    {
      name: String,
      yearsOfExperience: Number,
    },
  ],
});

module.exports = Response = mongoose.model('response', ResponseSchema);
