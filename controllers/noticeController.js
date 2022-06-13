const Applicant = require('./../models/applicant');
const Notice = require('./../models/notice');
const Pofolup = require('./../models/pofolup');
const applicantController = require('./../controllers/applicantController');
const s3Controller = require('./../controllers/s3Controller');
const nodemailerController = require('./../controllers/nodemailerController');

const moment = require('moment-timezone');



exports.getTotalNotice = (req, res, next) => {
  Pofolup.find({}, (error, pofolupDB)=>{
    if (error){
      console.log('error at getTotalUser! '+error)
    }else{
      req.totalNotice = pofolupDB[0].totalNotice;
    }
    next();
  });
};

exports.getAllNotices = (req, res, next) => {
  Notice.find({}, (error, notices) => {
    if (error) {
      console.log(err);
    } else {
      req.noticesData = notices;
      next();
    }
  });
};

exports.createNotice = (req, res, next) => {
  //현재 인원 수
  let currentNotice = req.totalNotice;
  currentNotice = ('0000'+currentNotice).slice(-4);
  let newNotice = new Notice({
    noticeNumber: currentNotice,
    adminId: req.user._id,
    adminName: req.user.realname,
    title: req.body.title,
    content: req.body.content,
    file: req.files[0].filename,
    createDate: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm'),
  });

  newNotice.save((error, Notice) => {
    if (error) {
      console.log('Notice save error');
      console.log(error);
    } else {
      //s3에 이미지 업로드
      s3Controller.s3NoticeUpload(req, res, req.files[0].filename);
      //총 공지사항 수 +1
      Pofolup.updateOne({}, {$inc:{totalNotice:1}}, (error, pofolupDB)=>{
        if (error){
          console.log(error);
        }else{
          s3Controller.s3Upload(req, res, req.files[0].filename);
          next();
        }
      });
    }
  });
};

exports.deleteNotice = (req, res, noticeNumber) => {
  //console.log('사용자 삭제 시도');
  Notice.find({noticeNumber: noticeNumber}, async (error, applicant) => {
    if (error) {
      console.log('error at deleteNotice' + error);
    } else {
      //이미지 삭제. 일단 남겨두는 쪽으로
      //지울거면 s3Controller에서 s3NoticeDelete 함수 작성해줘야함
      //s3Controller.s3Delete(req, res, applicant.username, applicant.file);
      //공지사항 삭제
      Notice.deleteOne({
        _id: applicant._id
      }, (error, result) => {
        if (error) {
          console.log('error at deleteNotice');
          console.log(error);
        } else {
          //console.log('유저 삭제 성공');
        }
      });
    }
  });
};


exports.findNotice = (req, res, next) => {
  let targetName;

  Notice.find({
    noticeNumber: req.params.noticeNumber
  }, (error, Notices) => {
    if (error) {
      console.log(error);
    } else {
      req.noticesData = Notices;
      next();
    }
  });

};
