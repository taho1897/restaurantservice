var mysql = require('mysql');
var async = require('async');

var dbConfig = {
  host     : process.env.DB_HOST,
  user     : process.env.DB_USER,
  password : process.env.DB_PASSWORD,
  database : process.env.DB_NAME
};

function placeOrder(orderObj, callback) {
  var sql_insert_menu_order = 'INSERT INTO menu_order(branch_id, customer_id) ' +
    'VALUES(?, ?)';
  var sql_insert_menu_order_details = 'INSERT INTO menu_order_details(menu_order_id, branch_menu_id, quantity, menu_price) ' +
    'VALUES(?, ?, ?, ?)';
  var sql_select_menu_price = 'SELECT m.price ' +
                              'FROM branch_menu bm JOIN menu m ON(bm.menu_id = m.id) ' +
                              'WHERE bm.id = ?';
  var sql_select_menu_order_dtime = 'SELECT date_format(convert_tz(mo.order_dtime, \'+00:00\', \'+09:00\'), \'%Y-%m-%d %H:%i:%s\') odtime ' +
                                    'FROM menu_order mo ' +
                                    'WHERE mo.id = ? ';

  var dbConn = mysql.createConnection(dbConfig);
  dbConn.beginTransaction(function(err) {
    if (err) {
      return callback(err);
    }
    async.series([insertMenuOrder, insertMenuOrderDetailsEach], function(err) {
      if (err) {
        return dbConn.rollback(function() {
          callback(err);
          dbConn.end();
        });
      }
      dbConn.commit(function() {
        callback(null, orderObj);
        dbConn.end();
      })
    });
  });

  function insertMenuOrder(callback) {
    dbConn.query(sql_insert_menu_order, [orderObj.branch_id, orderObj.customer_id], function(err, result) {
      if (err) {
        return callback(err);
      }
      console.log('result.insertId: ' + result.insertId);
      orderObj.id = result.insertId;
      selectMenuOrderDtime(orderObj.id, function(err, result) {
        if (err) {
          return callback(err);
        }
        orderObj.order_dtime = result;
        callback(null);
      });
    });
  }

  function insertMenuOrderDetailsEach(callback) {
    async.each(orderObj.details, function(item, done) {
      insertMenuOrderDetails(orderObj.id, item, done);
    }, function(err) {
      if (err) {
        return callback(err);
      }
      callback(null);
    });
  }

  function insertMenuOrderDetails(id, item, callback) {
    selectMenuPrice(item.branch_menu_id, function(err, price) {
      if (err) {
        return callback(err);
      }
      item.menu_price = price;
      dbConn.query(sql_insert_menu_order_details,
        [id, item.branch_menu_id, item.quantity, item.menu_price], function(err, result) {
          if (err) {
            return callback(err);
          }
          callback(null);
        });
    });
  }

  function selectMenuPrice(branch_menu_id, callback) {
    dbConn.query(sql_select_menu_price, [branch_menu_id], function(err, results) {
      if (err) {
        return callback(err);
      }
      callback(null, results[0].price);
    });
  }

  function selectMenuOrderDtime(menu_order_id, callback) {
    dbConn.query(sql_select_menu_order_dtime, [menu_order_id], function(err, results) {
      if (err) {
        return callback(err);
      }
      callback(null, results[0].odtime);
    });
  }

}


module.exports.placeOrder = placeOrder;