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
    streetAddress: {
      type: String,
    },
    state: {
      type: Schema.Types.ObjectId,
      ref: 'state',
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
        type: Schema.Types.ObjectId,
        ref: 'tag',
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports = Post = mongoose.model('post', PostSchema);
