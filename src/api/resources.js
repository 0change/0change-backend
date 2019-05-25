const { Router } = require('express');
const ResourceController = require('../controllers/ResourceController');
let router = Router();

router.all('/tokens', ResourceController.tokens);
router.all('/currencies', ResourceController.currencies);
router.all('/countries', ResourceController.countries);
router.all('/payment-methods', ResourceController.paymentMethods);

module.exports = router;