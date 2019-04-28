const mongoose = require('mongoose');

module.exports = callback => {
	// connect to a database if needed, then pass it to `callback`:
  mongoose.connect(process.env.MONGOOSE_CS, {useNewUrlParser: true});
  let db = mongoose.connection;
  db.on("open", function(ref) {
    console.log("Connected to mongo server.");
    return callback(db);
  });
	// callback();
}
