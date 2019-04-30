const { version } = require('../../package.json');
const { Router } = require('express');
const {forceAuthorized} = require('../middleware/Authenticate');
const authRoutes = require('./auth');
const userRoutes = require('./user');
const advertisementRoutes = require('./advertisement');
const tradeRoutes = require('./trade');
const resourceRoutes = require('./resources');
const seedRoutes = require('./seed');
const facets = require('./facets');

module.exports = ({ config, db }) => {
	let api = Router();
	// mount the facets resource
	// api.use('/facets', facets({ config, db }));
	api.use('/auth', authRoutes);
	api.use('/user', forceAuthorized, userRoutes);
  	api.use('/advertisement', advertisementRoutes);
  	api.use('/trade', tradeRoutes);
	api.use('/resource', resourceRoutes);
	api.use('/seed', seedRoutes);
	// perhaps expose some API metadata at the root
	api.get('/', (req, res) => {
		res.json({ version });
	});

	return api;
}
