var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');// express-session 추가
var passport = require('passport');// passport framework 로딩
var redis = require('redis');// Redis 서버에 session 구현 위해 추가
var redisClient = redis.createClient();// Redis 서버에 session 구현 위해 추가
var redisStore = require('connect-redis')(session);// Redis 서버에 session 구현 위해 추가

var auth = require('./routes/auth');
var customer = require('./routes/customer');
var branch = require('./routes/branch');
var menu = require('./routes/menu');
var order = require('./routes/order');
var notification = require('./routes/notification');// FCM 사용 추가 코드

var app = express();

app.set('env', 'development');

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));// 서비스 시 qs를 사용하기에 extended를 true로 변경
app.use(cookieParser());
/*Redis 사용 전 사용 하던 Session
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: true,
    saveUninitialized: true
}));*/
app.use(session({// Redis 서버에 session 구현 위해 추가
    secret: process.env.SESSION_SECRET,
    store: new redisStore({
        host: "127.0.0.1",
        port: 6379,
        client: redisClient
    }),
    resave: true,// 변경이 없으면 저장하지 말라는 옵션
    saveUninitialized: false// 저장된것이 없으면 저장하지 말라는 옵션
}));

app.use(passport.initialize());
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/images', express.static(path.join(__dirname, 'uploads/images/menus')));

app.use('/auth', auth);// 로그인 인증 추가 부분
app.use('/orders', order);
app.use('/customers', customer);
app.use('/menus', menu);
// app.use('/branches', branch);
app.use('/notifications', notification);// FCM 사용 추가 코드

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.send({
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.send({
    message: err.message,
    error: {}
  });
});


module.exports = app;
