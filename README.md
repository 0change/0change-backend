LocalERC20 express API server
==================================

To see how this things work's see:

- REST resources as middleware via [resource-router-middleware](https://github.com/developit/resource-router-middleware)
- CORS support via [cors](https://github.com/troygoode/node-cors)
- Body Parsing via [body-parser](https://github.com/expressjs/body-parser)
- Database [Mongoose](https://github.com/Automattic/mongoose)

Configuration
---------------
Rename the file [.envexample] to [.env] and set the following configurations:
- Mongodb connection string.
- Server running port.
- JsonWebToken auth secret.
- BrightID upload server IP address.
- Your website avatar, publicKey and name.

Getting Started
---------------

```sh
# clone it
git clone https://github.com/sadeghte/localerc20-back.git
cd localerc20-back

# Make it your own
rm -rf .git && git init && npm init

# Install dependencies
npm install

# Start live-reload server
PORT=4000 npm start

```

Seed Database
-------------

open this url in your browser
```
http://localhost:4000/api/v0.1/seed
```

License
-------

MIT
