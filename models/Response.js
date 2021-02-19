const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResponseSchema = new mongoose.Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'user',
      required: true,
    },
    postId: {
      type: Schema.Types.ObjectId,
      ref: 'post',
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
    status: {
      type: String,
      enum: ['Under Review', 'Rejected', 'Shortlisted'],
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = Response = mongoose.model('response', ResponseSchema);
