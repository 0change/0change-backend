require('dotenv').config();
require('./js-extend');
const croneJobs = require('./cron-jobs/index');
const http = require('http');
const express = require('express');
const {initSocket} = require('./socket-io');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const initializeDb = require('./db');
const middleware = require('./middleware');
const Authenticate = require('./middleware/Authenticate');
const localeMoment = require('./middleware/localeMoment');
const api = require('./api');
const config = require('./config.json');
const {forceAuthorized} = require('./middleware/Authenticate');
var i18n = require("i18n");
const path = require('path');
require('./coreEventHandlers');

let app = express();
app.server = http.createServer(app);
app.server.timeout = 5 * 60 * 1000;

let io = initSocket(app.server);

app.use(express.static('public'));
app.use('/uploads', /*forceAuthorized,*/ express.static('uploads'));
app.use('/scripts/socketio/', /*forceAuthorized,*/ express.static('node_modules/socket.io-client/dist'));

// logger
app.use(morgan('dev'));

// 3rd party middleware
app.use(cors({
	exposedHeaders: config.corsHeaders
}));

app.use(bodyParser.json({
	limit : config.bodyLimit
}));

app.use(i18n.init);
i18n.configure({
    locales:['en', 'fa'],
    objectNotation: true,
    directory: __dirname + '/../locales'
});



// connect to db
initializeDb( db => {

	// internal middleware
	app.use(middleware({ config, db }));

	// api router
	app.use('/api/v0.1', localeMoment, Authenticate.setUser, api({ config, db }));
	app.use('/file', express.static("user_files"));
	app.all('/stats', function (req, res, next) {
		res.send({success: true, message: 'server running'});
	});
	app.all('/', function (req, res, next) {
		res.send({success: true, message: 'server running'});
	});
	app.server.listen(process.env.HTTP_PORT || config.port, () => {
		console.log(`Started on port ${app.server.address().port}`);
		croneJobs.init();
	});
});

module.exports = app;
