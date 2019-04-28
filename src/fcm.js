const admin = require('firebase-admin');
var serviceAccount = require('../angure-9bc3f-firebase-adminsdk-8wdws-0fa1565fb1.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://<DATABASE_NAME>.firebaseio.com'
});