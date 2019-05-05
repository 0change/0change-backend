const {Router} = require('express');
const User = require('../database/mongooseModels/User');
const Feedback = require('../database/mongooseModels/Feedback');
const requireParam = require('../middleware/requestParamRequire');
let router = Router();

router.post('/get', function (req, res, next) {
    let userId = req.body.userId;
    let user = null;
    let userInfoPromise = null;
    if (!userId) {
        userInfoPromise = Promise.resolve(req.data.user);
    } else {
        userInfoPromise = User.findOne({_id: userId});
    }
    userInfoPromise
        .then(_user => {
            console.log('user: ', user);
            user = _user;
            if (req.body.feedback) {
                return Feedback.find({user: user._id})
            } else {
                return null;
            }
        })
        .then(feedbacks => {
            console.log('feedbacks: ', feedbacks);
            let response = {
                success: true,
                user
            };
            if (req.body.feedback)
                response.feedbacks = feedbacks;
            res.json(response);
        })
        .catch(error => {

            console.log(error);
            res.status(500).json({
                success: false,
                message: error.message || "Server side error",
                error
            });
        })
});

module.exports = router;