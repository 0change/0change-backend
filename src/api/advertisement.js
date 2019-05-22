const { Router } = require('express');
const OfferController = require('../controllers/OfferController');
const {forceAuthorized} = require('../middleware/Authenticate');
const requireParam = require('../middleware/requestParamRequire');
const bind = require('../middleware/bindRequestToModel');
let router = Router();

router.post('/publish', forceAuthorized, requireParam('advertisement'), OfferController.publish);
router.post('/edit', forceAuthorized, requireParam('id:objectId','advertisement'), OfferController.edit);
router.post('/set-enable', forceAuthorized, requireParam('id:objectId', 'enable'), OfferController.enable);
router.post('/delete', forceAuthorized, requireParam('id:objectId'), OfferController.delete);
router.get('/list', forceAuthorized, OfferController.list)
router.all('/get', requireParam(['id:objectId']), OfferController.get)
router.post('/test-bind', bind('advertisement:Advertisement'), OfferController.testBind)

module.exports = router;