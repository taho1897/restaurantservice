var express = require('express');
var router = express.Router();
var formidable = require('formidable');
var util = require('util');
var path = require('path');
var Menu = require('../models/menu');
var async = require('async');
var isSecure = require('./common').isSecure;// HTTPS 사용 위해 추가

router.get('/', isSecure, function(req, res, next) {// HTTPS 사용 위해 추가
    var message = '';
    var data = {};

    if (req.url.match(/\/\?pageNo=\d+&rowCount=\d+/i)) { // 주문 목록 조회 req.url: /?pageNo=1&rowCount=10
        message = 'list Menus';
        var pageNo = parseInt(req.query.pageNo, 10);
        var rowCount = parseInt(req.query.rowCount, 10);

         Menu.listMenus(pageNo, rowCount, function(err, menus) {
            if (err) {
                return next(err);
            }
            data.results = menus;
            res.send({
                message: message,
                data: data
            });
        });
    }
});

router.get('/:id', function(req, res, next) {
    var menuId = req.params.id;
    Menu.findMenu(menuId, function (err, menu) {
        if (err) {
            return next(err);
        }
        res.send({
            message: 'show menu(' + req.params.id + ')',
            menu: menu
        });
    });
});

router.post('/', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../uploads/images/menus');
    form.keepExtensions = true;
    form.multiples = true;
    form.parse(req, function (err, fields, files) {
        if (err) {
            return next(err);
        }
        var message = '';
        var menu = {};
        menu.name = fields.menu_name;
        menu.price = parseInt(fields.price, 10);
        menu.files = [];
        // files.photos가 Array인 경우
        if (files.photos instanceof Array) {
            message = 'create menu with files';
            menu.files = files.photos;
        } else if (files.photos) {
            message = 'create menu with a file';
            menu.files.push(files.photos);
        } else {
            message = 'create menu without a file';
        }
        Menu.createMenu(menu, function (err, result) {
            if (err) {
                return next(err);
            }
            menu.id = result;
            res.send({
                message: message,
                result: menu
            });
        });
    });
});

router.put('/:id', function(req, res, next) {
    var form = new formidable.IncomingForm();
    form.uploadDir = path.join(__dirname, '../uploads/images/menus');
    form.keepExtensions = true;
    form.multiples = true;
    form.parse(req, function(err, fields, files) {
        if (err) {return next(err);}
        var menu = {};
        menu.files = [];
        if (files.photos instanceof Array) {
            menu.files = files.photos;
        } else if (files.photos instanceof Object) {
            menu.files.push(files.photos);
        }
        var menuId = req.params.id;
        Menu.updateMenuPhoto(menuId, menu, function(err, result) {
            if (err) {
                return next(err);
            }
            res.send({
                message: 'update menu(' + menuId + ')',
                changedRow : result
            });
        });
    });
});

router.delete('/:id', function(req, res, next) {
    var menuId = req.params.id;
    Menu.deleteMenu(menuId, function(err, result) {
        if (err) {
            return next(err);
        }
        res.send({
            message: 'delete menu(' + menuId + ')',
            deletedRow : result
        });
    });

});

module.exports = router;
