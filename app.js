var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


var admin = require('firebase-admin');
var schedule = require('node-schedule');

var serviceAccount = require('./courseshare-servicekey.json');

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://courseshare-45de6.firebaseio.com"
});


// var ref = admin.database().ref('lectures');
// ref.on('value', function (snapshot) {
//   snapshot.forEach(function (childSnapshot) {
//       console.log(childSnapshot.val().name);
//   })
// });


//once a minute
var rule = new schedule.RecurrenceRule();
rule.second = 10;

schedule.scheduleJob(rule, function(){
    console.log('The answer to life, the universe, and everything!')

    var ref = admin.database().ref('lectures').orderByChild("past").equalTo(false);
    var now = Date.now();
    console.log(now);

    ref.once('value', function (snapshot) {
        snapshot.forEach(function (childSnapshot) {
            var lecture = childSnapshot.val();
            var date = new Date(lecture.year, lecture.month-1, lecture.day, lecture.hour+1, lecture.minute, 0, 0);
            console.log(date);
            if (date < (now - 3600*24)) {
              admin.database().ref('lectures').child(lecture.id).child("past").set(true);
              admin.database().ref('users').child(lecture._user).child("_myLectures").child(lecture.id).set(null);
              admin.database().ref('users').child(lecture._user).child("_myPastLectures").child(lecture.id).set(true);
              console.log(lecture.name);
            }
        })
    });
});

module.exports = app;
