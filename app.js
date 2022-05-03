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
  const dotenv = require('dotenv');
  const path = require('path');

  //보안 관련 미들웨어
  const helmet = require('helmet');
  const hpp = require('hpp');
  const sanitize = require('sanitize-html');

  //mongoose
  const mongoose = require('mongoose');

  //router
  const userRouter = require('./routes/user');
  const positionRouter = require('./routes/position');
  const applicantController = require('./controllers/applicantController');
  dotenv.config({
    path: path.resolve(__dirname, "./.env")
  });

  const app = express();

  //https 받은 이후 삭제 예정
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  //기본 설정
  app.set('port', process.env.PORT);
  app.set('view engine', 'ejs');



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

  app.use(cookieParser(process.env.cookieKey));
  app.use(session({
    secret: process.env.cookieKey,
    resave: false,
    saveUninitialized: true,
    cookie:{
      httpOnly: true
    }
  }));

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

  //mongoose
  //Conneting
  mongoose
    .connect("mongodb://127.0.0.1:27017/recruit", {
      useNewUrlParser: true,
      useUnifiedTopology: true
    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });


  app.use((req, res, next)=>{
    res.locals.user = req.user;
    res.locals.login = req.isAuthenticated();
    req.login = req.isAuthenticated();
    next();
  });

  //라우터
  app.use('/', userRouter);
  app.use('/position', positionRouter);

  //에러 페이지
  app.all('*', (req, res) => {
    res.status(404).send('<h1>페이지를 찾을 수 없습니다.</h1>');
  });



  //서버와 포트 연결
  app.listen(app.get('port'), () => {
    //winston.info('App is running on port ' + app.get('port'));
    console.log(app.get('port'), '번 포트에서 실행 중..');
  })
