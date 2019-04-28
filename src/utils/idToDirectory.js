const resolveDir = require('path').resolve;
const moment = require('moment');
module.exports = (id, baseDir="") => {
    let date = new Date(parseInt(id.toString().substring(0, 8), 16) * 1000);
    return `/${baseDir}/${moment(date).format('YYYY/MM/DD')}/` + id.toString() + '/';
}