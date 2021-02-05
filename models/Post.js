const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const PostSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    employmentType: {
      type: String,
      required: true,
      enum: ['Full-Time', 'Part-Time', 'Contract'],
    },
    salary: {
      type: Number,
    },
    requirements: [
      {
        type: String,
      },
    ],
    responses: [
      {
        type: Schema.Types.ObjectId,
        ref: 'response',
      },
    ],
    numberOfResponses: {
      type: Number,
    },
    streetAddress: {
      type: String,
    },
    state: {
      type: String,
    },
    companyId: {
      type: Schema.Types.ObjectId,
      ref: 'company',
      required: true,
    },
    status: {
      type: 'String',
      enum: ['Active', 'Suspended', 'Deleted'],
      required: true,
    },
    tags: [
      {
        type: String,
      },
    ],
    yearsOfExperience: {
      type: Number,
    },
    skills: [
      {
        type: String,
      },
    ],
  },
  {
    timestamps: true,
  },
);

module.exports = Post = mongoose.model('post', PostSchema);
