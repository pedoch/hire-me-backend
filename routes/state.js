const express = require('express');
const router = express.Router();
const { check } = require('express-validator');
const stateController = require('../controllers/state');

// @route GET api/states
router.get(
	'/get-state',
	[check('stateId', 'State ID is required').not().isEmpty()],
	stateController.getState,
);

router.get('/get-states', stateController.getStates);

// @route POST api/states
router.post(
	'/create-state',
	[check('name', 'State name is required').not().isEmpty()],
	stateController.createState,
);

module.exports = router;
