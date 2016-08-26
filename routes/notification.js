var express = require('express');
var router = express.Router();
var fcm = require('node-gcm');

router.post('/', function (req, res, next) {
    var ids = req.body.ids;
    // var message = req.body.message;

    // token을 select

    var tokens = [];
    var message = new fcm.Message({// 위에서 가져오거나 여기서 바로 만들거나
        data: {
            key1: 'values1',
            key2: 'values2',
        },
        notification: {
            title: '',
            icon: '',
            body: ''
        }
    });

    var sender = new fcm.Sender('AIzaSyAdrYmCs6M-Oe4NjMlCKriXuGuWETODQCw');
    sender.send(mesage, {registration: tokens}, function (err, response) {
        if (err) {
            return next(err);
        }
    });
});



module.exports = router;