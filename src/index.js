require('dotenv').config();
require('./js-extend');
const croneJobs = require('./cron-jobs');
const http = require('http');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const initializeDb = require('./db');
const middleware = require('./middleware');
const Authenticate = require('./middleware/Authenticate');
const api = require('./api');
const config = require('./config.json');
const {forceAuthorized} = require('./middleware/Authenticate');
require('./coreEventHandlers');

let app = express();
app.server = http.createServer(app);
app.server.timeout = 5 * 60 * 1000;

app.use(express.static('public'));
app.use('/uploads', /*forceAuthorized,*/ express.static('uploads'));

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

// connect to db
initializeDb( db => {

	// internal middleware
	app.use(middleware({ config, db }));

	// api router
	app.use('/api/v0.1', Authenticate.setUser, api({ config, db }));
	app.use('/file', express.static("user_files"));
	app.all('/stats', function (req, res, next) {
    res.send({success: true, message: 'server running'});
  });
	app.server.listen(process.env.HTTP_PORT || config.port, () => {
		console.log(`Started on port ${app.server.address().port}`);
		croneJobs.init();
	});
});

module.exports = app;
