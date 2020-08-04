const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ResponseSchema = new mongoose.Schema({
	userId: {
		type: Schema.Types.ObjectId,
		ref: 'user',
		required: true,
	},
});

module.exports = Response = mongoose.model('response', ResponseSchema);
