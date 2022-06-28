//이 웹사이트는 안진형(cookies09@naver.com)에 의해 개발되었습니다.

  //express 설정
  const express = require('express');

  const morgan = require('morgan');
  //session, passport
  const cookieParser = require('cookie-parser');
  const session = require('express-session');
  const passport = require('passport');
  const Localstrategy = require('passport-local').Strategy;

  //LOG 기록 미들웨어
  const winston = require('./config/winston');
  //.env 파일을 위한 미들웨어
  const dotenv = require('dotenv');

  //보안 관련 미들웨어
  const helmet = require('helmet');
  const hpp = require('hpp');
  const sanitize = require('sanitize-html');

  //mongoose
  const mongoose = require('mongoose');

  //router
  const adminRouter = require('./routes/admin');
  const applicantRouter = require('./routes/applicant');

  //기타 미들웨어
  const path = require('path');
  const moment = require('moment-timezone');

  const app = express();

  //기본 설정
  app.set('port', process.env.PORT);
  app.set('view engine', 'ejs');
  //.env 연결
  dotenv.config({
    path: path.resolve(__dirname, "./.env")
  });

  //폴더 지정
  app.use(express.static(__dirname + '/public')); //스태틱 폴더 지정
  app.use('/uploads', express.static(__dirname + '/uploads'));
  app.use('/js', express.static(__dirname + '/public/js')); //script 폴더 지정
  app.use('/styles', express.static(__dirname + '/public/styles')); //css 폴더 지정

  //배포, 개발 시 설정
  if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined'));
    app.enable('trust proxy');
    app.use(helmet({
      contentSecurityPolicy: false
    }));
    app.use(hpp());
  } else {
    app.use(morgan('dev'));
  }

  const sessOptions = {
    secret: process.env.cookieKey,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
    },
  };
  if (process.env.NODE_ENV === 'production') {
    sessOptions.proxy = true;
    sessOptions.cookie.secure = true;
  }
  app.use(session(sessOptions));
  app.use(cookieParser(process.env.cookieKey));

  //req.body 에 접근하기 위한 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));

  //passport
  app.use(passport.initialize());
  app.use(passport.session());
  //passport-local
  const Applicant = require('./models/applicant');
  passport.use(new Localstrategy(Applicant.authenticate()));
  passport.serializeUser(Applicant.serializeUser());
  passport.deserializeUser(Applicant.deserializeUser());

  //로컬에서 https 아니어도 작동하기 위해 필요. 서버에서는 필요없다
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  //mongoose
  //Conneting
  mongoose
  //서버에서는 mongo: 사용. 로컬에서는 127.0.0.1: 사용
    //.connect("mongodb://mongo:27017/pofolup", {
    .connect("mongodb://127.0.0.1:27017/pofolup", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });

  //로그인된 유저
  app.use((req, res, next) => {
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    req.login = req.isAuthenticated();
    next();
  });

  //라우터
  app.use('/', adminRouter);
  app.use('/', applicantRouter);

  //에러 페이지
  app.all('*', (req, res) => {
    res.status(404).render('errorPage',{
      errorDetail: '페이지를 찾을 수 없습니다.'
    });
  });



  //서버와 포트 연결
  app.listen(app.get('port'), () => {
    //winston.info('App is running on port ' + app.get('port'));
    console.log(app.get('port'), '번 포트에서 실행 중..');
  });
