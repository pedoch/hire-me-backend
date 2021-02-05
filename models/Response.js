const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResponseSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    resume: {
      name: String,
      url: String,
    },
    skills: [
      {
        name: String,
        yearsOfExperience: Number,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = Response = mongoose.model('response', ResponseSchema);
