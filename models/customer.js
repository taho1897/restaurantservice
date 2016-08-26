var mysql = require('mysql');
var dbConfig = require('../config/dbConfig');
var dbPool = require('./common').dbPool;
/*var dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
};*/

function findOrCreate(profile, callback) {


    /*var sql_find_facebook_id = 'SELECT id, name, email, facebookid ' +
                               'FROM customer ' +
                               'WHERE facebookid = ?';
    var sql_create_facebook_id = 'INSERT INTO customer(name, email, facebookid) ' +
                                 'VALUES(?, ?, ?)';

    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_find_facebook_id, [profile.id], function (err, result) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            if (result.length !== 0) {
                dbConn.release();
                var user = {};
                user.id = result[0].id;
                user.name = result[0].name;
                user.email = result[0].email;
                user.facebookid = result[0].facebookid;
                return callback(null, user);
            }
            dbConn.query(sql_create_facebook_id, [profile.displayName, profile.emails[0].value, profile.id], function (err, result) {
                dbConn.release();
                if (err) {
                    return callback(err);
                }
                var user = {};
                user.id = result.insertId;
                user.name = profile.displayName;
                user.email = profile.emails[0].value;
                user.facebookid = profile.id;
                return callback(null, user)
            });
        });
    });
}

function findByEmail(email, callback) {
    var sql_find_by_email = 'SELECT id, name, email, password FROM customer WHERE email = ?';
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_find_by_email, [email], function (err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            if (result.length === 0) {
                return callback(null, null)
            }
            callback(null, result[0]);
        });
    });*/

}

function verifyPassword(password, hashPassword, callback) {
    var sql_hash_password = 'SELECT SHA2(?, 512) password;';
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_hash_password, [password], function (err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            if (result[0].password !== hashPassword) {
                return callback(null, false);
            }
            callback(null, true);
        });
    });
}

function listCustomers(pageNo, rowCount, callback) {
    var sql_customer_list = 'SELECT id, name, email FROM customer ORDER BY id LIMIT ?, ?;';
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_customer_list, [(pageNo - 1) * rowCount, rowCount], function(err, results) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            callback(null, results);
        });
    });
}
function registerCustomer(customerObj, callback) {
    var sql_register_customer = 'INSERT INTO customer(name, email, password) ' +
                                'VALUES (?, ?, sha2(?, 512))';
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_register_customer,
            [customerObj.name, customerObj.email, customerObj.password], function(err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            customerObj.id = result.insertId;
            callback(null, customerObj);
        });
    });
}

function findCustomer(customerId, callback) {
    var sql_select_customer = 'SELECT id, name, email, facebookid FROM customer WHERE id = ?';

    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql_select_customer, [customerId], function (err, result) {
            dbConn.release();
            if (err) {
                return callback(err);
            }
            var user = {};
            user.id = result[0].id;
            user.name = result[0].name;
            user.email = result[0].email;
            user.facebookid = result[0].facebookid;
            return callback(null, user);
        });
    });
}
function updateCustomer(customerObj, callback) {
    var sql_update_customer = 'UPDATE customer SET password = sha2(?, 512) ' +
                              'WHERE id = ?';
    var sql_select_customer_name = 'SELECT name FROM customer WHERE id = ?';
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function(err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            dbConn.query(sql_update_customer,
                [customerObj.password, customerObj.id], function (err, results) {
                if (err) {
                    return dbConn.rollback(function() {
                        dbConn.release();
                        callback(err);
                    });
                }
                var resultObj = {changedRows: 0};
                dbConn.query(sql_select_customer_name, [customerObj.id], function(err, result) {
                    if (err) {
                        return dbConn.rollback(function () {
                            dbConn.release();
                            callback(err);
                        })
                    }
                    resultObj.name = result[0].name;
                });
                dbConn.commit(function() {
                    resultObj.changedRows += results.changedRows;
                    dbConn.release();
                    callback(null, resultObj);
                });
            })
        });
    });
}



module.exports.listCustomers = listCustomers;
module.exports.registerCustomer = registerCustomer;
module.exports.findCustomer = findCustomer;
module.exports.updateCustomer = updateCustomer;
module.exports.findByEmail = findByEmail;
module.exports.verifyPassword = verifyPassword;
module.exports.findOrCreate = findOrCreate;