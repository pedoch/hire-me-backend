const State = require('../models/State');
// const { validationResult } = require('express-validator');
// const jwt = require('jsonwebtoken');
// const config = require('config');
// const bcrypt = require('bcryptjs');
// const sgMail = require('@sendgrid/mail');
// require('dotenv').config();

exports.getStates = async (req, res, next) => {
	try {
		const states = await State.find().sort({ name: 1 });

		return res.status(200).json({ states });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
};

exports.getState = async (req, res, next) => {
	const { stateId } = req.body;
	try {
		const state = State.findById(stateId);

		if (!state) return res.status(400).json({ message: 'State does not exist' });

		return res.status(200).json({ state });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
};

exports.createState = async (req, res, next) => {
	const { name } = req.body;
	try {
		const state = new State({
			name,
		});

		await state.save();

		return res.status(200).json({ message: 'State created' });
	} catch (err) {
		console.error(err.message);
		res.status(500).send('Server Error');
	}
};
