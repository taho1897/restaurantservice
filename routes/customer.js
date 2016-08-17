var express = require('express');
var router = express.Router();
var Customer = require('../models/customer')


// register customer
router.post('/', function(req, res, next) {
    var newCustomer = {};
    newCustomer.name = req.body.name;
    newCustomer.email = req.body.email;
    newCustomer.password = req.body.password;

    Customer.registerCustomer(newCustomer, function(err, result) {
        if (err) {
            return next(err);
        }
        res.send({
            message: 'customer no: ' + result.id,
            result: {
                id: result.id,
                customer_name: result.name,
                customer_email: result.email
            }
        });
    });
});
// customer list
router.get('/', function(req, res, next) {
    var message = '';
    var data = {};

    if (req.url.match(/\/\?pageNo=\d+&rowCount=\d+/i)) { // 주문 목록 조회 req.url: /?pageNo=1&rowCount=10
        message = 'list Customers';
        var pageNo = parseInt(req.query.pageNo, 10);
        var rowCount = parseInt(req.query.rowCount, 10);

        Customer.listCustomers(pageNo, rowCount, function(err, customers) {
            if (err) {
                return next(err);
            }
            data.results = customers;
            res.send({
                message: message,
                data: data
            });
        });
    }
});
// show customer
router.get('/:oid', function(req, res, next) {
    var oid = req.params.oid;
    Customer.findCustomer(oid, function(err, results) {
        if (err) {
            return next(err);
        }
        res.send({
            message: req.params.oid + ', find customer',
            result: {
                details: results
            }});
    });
});
// update customer
router.put('/:oid', function(req, res, next) {
    var oid = req.params.oid;
    var customerObj = {};
    customerObj.id = oid;
    customerObj.password = req.body.password;
    Customer.updateCustomer(customerObj, function(err, results) {
        if (err) {
            return next(err);
        }
        res.send({
            message: req.params.oid + ', updated customer',
            result: {
                customer_name: results.name,
                changedRows: results.changedRows
            }
        });
    });
});


module.exports = router;
