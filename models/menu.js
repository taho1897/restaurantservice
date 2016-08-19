var mysql = require('mysql');
var async = require('async');
var dbConfig = require('../config/dbConfig');
var dbPool = require('./common').dbPool;
var path = require('path');
var url = require('url');
var fs = require('fs');



function createMenu(menu, callback) {
    var sql_insert_menu = 'INSERT INTO menu(name, price) ' +
        'VALUES (?, ?)';
    var sql_insert_file = 'INSERT INTO file(menu_id, filename, filepath) ' +
        'VALUES (?, ?, ?)';

    var menu_id;
    // var dbConn = mysql.createConnection(dbConfig);
    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function (err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            async.series([insertMenu, insertFile], function (err) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null, menu_id);
                })
            });
        });

        function insertMenu(callback) {
            dbConn.query(sql_insert_menu, [menu.name, menu.price], function (err, result) {
                if (err) {
                    return callback(err);
                }
                menu_id = result.insertId;
                callback(null);
            });
        }

        function insertFile(callback) {
            async.each(menu.files, function (item, done) {
                dbConn.query(sql_insert_file, [menu_id, item.name, item.path], function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    done(null);
                });
            }, function (err) {
                if (err) {
                    return callback(err);
                }
                callback(null);
            });
        }
    });
}

function listMenus(pageNo, rowCount, callback) {
    var sql = 'SELECT id, name, price FROM menu ORDER BY id LIMIT ?, ?';

    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.query(sql, [rowCount * (pageNo - 1), rowCount], function (err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            dbConn.release();
            callback(null, results);
        });
    });

}

function findMenu(menuId, callback) {
    var sql_select_menu = 'SELECT id, name, price FROM menu WHERE id = ?';
    var sql_select_file = 'SELECT filename, filepath FROM file WHERE menu_id = ?';

    dbPool.getConnection(function (err, dbConn) {
        if (err) {
            return callback(err);
        }
        var menu = {};
        async.parallel([selectMenu, selectFile], function(err, results) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            menu.id = results[0][0].id;
            menu.name =results[0][0].name;
            menu.price = results[0][0].price;
            menu.photodata = [];
            async.each(results[1], function (item, done) {
                var filename = path.basename(item.filepath);
                menu.photodata.push({
                    originalFilename: item.filename,
                    fileUrl: url.resolve('http://localhost:3000', '/images/' + filename)
                });
                done();
            });
            dbConn.release();
            callback(null, menu);
        });

        function selectMenu(callback) {
            dbConn.query(sql_select_menu, [menuId], function (err, results) {
                if (err) {
                    return callback(err);
                }
                callback(null, results);
            });
        }

        function selectFile(callback) {
            dbConn.query(sql_select_file, [menuId], function(err, results) {
                if (err) {
                    return callback(err);
                }
                callback(null, results);
            });
        }
    });
}

function deleteMenu(menuId, callback) {
    var sql_delete_file = 'delete from file where menu_id = ? ';
    var sql_delete_menu = 'delete from menu where id = ? ';
    var sql_select_filepath = 'select filepath from file where menu_id = ?';

    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function (err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            async.series([deleteRealFile, deleteFile, deleteMenu], function (err, result) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null, result);
                })
            }); // async
        });
        function deleteRealFile(callback) {
            dbPool.query(sql_select_filepath, [menuId], function(err, result) {
                if (err) {
                    return callback(err);
                }
                async.each(result, function(item, callback) {
                    if (err) {
                        return callback(err);
                    }
                    fs.unlink(item.filepath, function (err) {
                        if (err) {
                            return callback(err);
                        }
                    });
                }); // async function
                callback(null,result);
            });
        } // deleteRealFile
        function deleteFile(callback) {
            dbPool.query(sql_delete_file, [menuId], function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null,result);
            });
        } // deleteFile
        function deleteMenu(callback) {
            dbPool.query(sql_delete_menu, [menuId], function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null,result);
            });
        } // deleteMenu
    });

}

function updateMenuPhoto(menuId, menu, callback) {
    var sql_delete_file = 'delete from file where menu_id = ? ';
    var sql_select_filepath = 'select filepath from file where menu_id = ?';
    var sql_insert_file = 'INSERT INTO file(menu_id, filename, filepath) VALUES (?, ?, ?)';
    dbPool.getConnection(function(err, dbConn) {
        if (err) {
            return callback(err);
        }
        dbConn.beginTransaction(function (err) {
            if (err) {
                dbConn.release();
                return callback(err);
            }
            async.series([deleteRealFile, deleteFile, insertFile], function (err, result) {
                if (err) {
                    return dbConn.rollback(function () {
                        dbConn.release();
                        callback(err);
                    });
                }
                dbConn.commit(function () {
                    dbConn.release();
                    callback(null, result);
                });
            }); // async
        });
        function deleteRealFile(callback) {
            dbPool.query(sql_select_filepath, [menuId], function (err, result) {
                if (err) {
                    return callback(err);
                }
                async.each(result, function (item, callback) {
                    if (err) {
                        return callback(err);
                    }
                    fs.unlink(item.filepath, function (err) {
                        if (err) {
                            return callback(err);
                        }
                    });
                }); // async function
                callback(null, result);
            });
        } // deleteRealFile
        function deleteFile(callback) {
            dbPool.query(sql_delete_file, [menuId], function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
        } // deleteFile
        function insertFile(callback) { // 여러개일때
            async.each(menu.files, function (item, done) {
                dbConn.query(sql_insert_file, [menuId, item.name, item.path], function (err, result) {
                    if (err) {
                        return done(err);
                    }
                    done(null, result);
                });
            }, function (err, result) {
                if (err) {
                    return callback(err);
                }
                callback(null, result);
            });
        } // deleteMenu
    });
}

module.exports.createMenu = createMenu;
module.exports.listMenus = listMenus;
module.exports.findMenu = findMenu;
module.exports.deleteMenu = deleteMenu;
module.exports.updateMenuPhoto = updateMenuPhoto;