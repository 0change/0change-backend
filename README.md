0change express API server
==================================

To see how this things work's see:

- REST resources as middleware via [resource-router-middleware](https://github.com/developit/resource-router-middleware)
- CORS support via [cors](https://github.com/troygoode/node-cors)
- Body Parsing via [body-parser](https://github.com/expressjs/body-parser)
- Database [Mongoose](https://github.com/Automattic/mongoose)

Configuration
---------------
Rename the file [.envexample] to [.env] and update configurations.

Setup
---------------
```
# clone 0change-backend repository
$ git clone https://github.com/0change/0change-backend.git

# install dependencies
$ cd 0change-backend
$ npm install

# update config parameters
$ cp .env-example .env
$ nano .env

# start the backend
$ pm2 start pm2.config.js 
```

In next step you need to run [0change-frontend](https://github.com/0change/0change-frontend/).

License
-------

MIT
