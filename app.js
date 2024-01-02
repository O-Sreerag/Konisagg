const express = require('express');
const createError = require('http-errors');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const session = require('express-session')
const hbs = require('hbs');


const app = express();


// mount middlewares
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


hbs.registerHelper('eq', function (a, b) {
  return a === b;
});
// Define a custom helper named "ifCond" for conditional checks
hbs.registerHelper('ifCond', function(v1, operator, v2, options) {
  switch (operator) {
      case '==':
          return (v1 == v2) ? options.fn(this) : options.inverse(this);
      case '===':
          return (v1 === v2) ? options.fn(this) : options.inverse(this);
      case '!=':
          return (v1 != v2) ? options.fn(this) : options.inverse(this);
      case '!==':
          return (v1 !== v2) ? options.fn(this) : options.inverse(this);
      case '<':
          return (v1 < v2) ? options.fn(this) : options.inverse(this);
      case '<=':
          return (v1 <= v2) ? options.fn(this) : options.inverse(this);
      case '>':
          return (v1 > v2) ? options.fn(this) : options.inverse(this);
      case '>=':
          return (v1 >= v2) ? options.fn(this) : options.inverse(this);
      default:
          return options.inverse(this);
  }
});
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


// setting routes
const usersRouter = require('./routes/user');
const adminRouter = require('./routes/admin');


// Configure express-session
app.use(session({
  secret: 'sirijapan', // Replace with a strong, unique secret key
  resave: false,
  saveUninitialized: false, // Set to false in production
  cookie: {
    secure: false, // Set to true in production for HTTPS
    httpOnly: true, // Recommended for improved security
    maxAge: 24 * 60 * 60 * 1000, // Session expiration time (e.g., 24 hours)
    sameSite: 'Lax' // Recommended for improved security
  }
}));


// database handling
const database = require('./config/mongoose')
database()


// handling routes
app.use('/', usersRouter);
app.use('/admin', adminRouter);

// Setup cron job here
const cronJob = require('./utility/cronJob');
cronJob.start(); // Assuming 'start' is a function that initiates your cron job

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
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

module.exports = app;
