var multer = require('multer')
var upload = multer({dest: 'uploads_temp_dir/'})
const {Router} = require('express');
const {forceAuthorized} = require('../middleware/Authenticate');
const requireParam = require('../middleware/requestParamRequire');
const TradeController = require('../controllers/TradeController');
let router = Router();

router.post('/search', TradeController.search);
router.post('/list', forceAuthorized, TradeController.userTradesList);
router.post('/create', forceAuthorized, requireParam('advertisementId:objectId', 'count:number'), TradeController.createTrade);
router.post('/message', forceAuthorized, upload.array('attachments[]'), requireParam('tradeId:objectId', 'message:string'), TradeController.message)
router.post('/get-info', forceAuthorized, requireParam('id:objectId'), TradeController.getInfo)
router.post('/start', forceAuthorized, requireParam('id:objectId'), TradeController.start)
router.post('/set-paid', forceAuthorized, requireParam('id:objectId'), TradeController.setPaid)
router.post('/release', forceAuthorized, requireParam('id:objectId'), TradeController.release)
router.post('/cancel', forceAuthorized, requireParam('id:objectId'), TradeController.cancel)
router.post('/dispute', forceAuthorized, requireParam('id:objectId', 'message:string'), TradeController.dispute)
router.post('/post-feedback', forceAuthorized, requireParam('tradeId:objectId', 'star:number'), TradeController.postFeedback)

module.exports = router;