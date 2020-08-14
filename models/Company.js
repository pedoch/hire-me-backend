const mongoose = require("mongoose");
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
    enum: ["Active", "Disabled"],
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
      ref: "post",
    },
  ],
  tags: [
    {
      type: String,
    },
  ],
});

module.exports = Company = mongoose.model("company", CompanySchema);
