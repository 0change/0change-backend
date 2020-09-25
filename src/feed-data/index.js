require('dotenv').config()

const initializeDb = require('../db')
const tokensFeed = require('./tokens-feed')
const currenciesFeed = require('./currencies-feed')
const countriesFeed = require('./countries-feed')
const walletsFeed = require('./wallets-feed')
const paymentMethodsFeed = require('./payment-methods-feed')

// connect to db
initializeDb((db) => {
  console.log('feed connected to db ...')

  Promise.resolve(true)
    // .then(tokensFeed)
    // .then(currenciesFeed)
    // .then(countriesFeed)
    // .then(walletsFeed)
    .then(paymentMethodsFeed)
    .catch(console.error)
    .then(() => {
      console.log('feed ends.')
      process.exit(0)
    })
})
