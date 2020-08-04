const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TagSchema = new mongoose.Schema({
	name: {
		type: String,
		required: true,
	},
});

module.exports = Tag = mongoose.model('tag', TagSchema);
