  //express 설정
  const express = require('express');
  const app = express();

  //router
  const userRouter = require('./routes/user');
  const positionRouter = require('./routes/position');

  app.use('/', userRouter);
  app.use('/position', positionRouter);

  //LOG 기록 미들웨어
  const morgan = require('morgan');
  const winston = require('./config/winston');
  const dotenv = require('dotenv');
  const path = require('path');
  dotenv.config({
    path: path.resolve(__dirname, "./.env")
  });

  //mongoose
  const mongoose = require('mongoose');
  const Applicant = require('./models/applicant');
  const applicantController = require('./controllers/applicantController');

  //보안 관련 미들웨어
  const helmet = require('helmet');
  const hpp = require('hpp');
  const sanitize = require('sanitize-html');

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

  //req.body 에 접근하기 위한 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({
    extended: true
  }));



  //mongoose
  //Conneting
  mongoose
    .connect("mongodb://127.0.0.1:27017/recruit", {
      useNewUrlParser: true,

    })
    .then(() => {
      console.log("Connected to MongoDB");
    })
    .catch((err) => {
      console.log(err);
    });






  //에러 페이지
  app.all('*', (req, res) => {
    res.status(404).send('<h1>페이지를 찾을 수 없습니다.</h1>');
  });



  //서버와 포트 연결
  app.listen(app.get('port'), () => {
    //winston.info('App is running on port ' + app.get('port'));
    console.log(app.get('port'), '번 포트에서 실행 중..');
  })
