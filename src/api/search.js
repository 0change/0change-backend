const {Router} = require('express');
const requireParam = require('../middleware/requestParamRequire');
const SearchController = require('../controllers/SearchController');
let router = Router();

router.post('/', SearchController.search);
router.post('/results', requireParam('search:Search'), SearchController.result);

module.exports = router;