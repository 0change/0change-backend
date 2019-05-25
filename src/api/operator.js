const {Router} = require('express');
const requireParam = require('../middleware/requestParamRequire');
const OperatorController = require('../controllers/OperatorController');
let router = Router();

router.all('/get-withdrawals', OperatorController.getWithdrawals);
router.post('/set-paid', requireParam('id:objectId', 'txHash:string'), OperatorController.setPaid);
router.post('/set-paid-manually', requireParam('id:objectId', 'txHash:string'), OperatorController.setPaidManually);
router.post('/check-status', requireParam('id:objectId'), OperatorController.checkStatus);
router.all('/get-disputes', OperatorController.getDisputes);
router.post('/unread-messages', OperatorController.unreadMessages)

module.exports = router;