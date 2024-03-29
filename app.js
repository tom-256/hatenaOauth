const express = require('express');
const path = require('path');
const favicon = require('serve-favicon');
const logger = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const passport = require('passport');
const HatenaStrategy = require('passport-hatena').Strategy
const session = require('express-session');

const routes = require('./routes/index');
const users = require('./routes/users');

const app = express();

passport.serializeUser((user, done) => {
  return done(null, user);
});
passport.deserializeUser((obj, done) => {
  return done(null, obj);
});

passport.use(new HatenaStrategy({
  consumerKey: process.env.HATENA_CONSUMER_KEY,
  consumerSecret: process.env.HATENA_CONSUMER_SECRET,
  callbackURL: 'http://localhost:3000/auth/hatena/callback'
}, (token, tokenSecret, profile, done) => {
  process.nextTick(() => {
    done(null, profile);
  });
}));

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
app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true
}));

app.use(passport.initialize());
app.use(passport.session());

//app.use('/', routes);
app.use('/users', users);

app.get('/', (req, res) => {
  res.render('index', { user: req.user });
});
app.get('/login', (req, res) => {
  res.render('login', { user: req.user });
});
app.get('/auth/hatena', passport.authenticate('hatena', {
  scope: ['read_public']
}));
app.get('/auth/hatena/callback', passport.authenticate('hatena', {
  failureRedirect: '/login'
}), (req, res) => {
  res.redirect('/');
});
app.get('/logout', (req, res) => {
  req.session.destroy();
  req.logout();
  res.redirect('/');
});
// catch 404 and forward to error handler
app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use((err, req, res, next) => {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    next();
  }
  res.redirect('/login');
};

module.exports = app;
