const Applicant = require('./../models/applicant');
const Notice = require('./../models/notice');
const Pofolup = require('./../models/pofolup');
const applicantController = require('./../controllers/applicantController');
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
    createDate: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm'),
  });

  newNotice.save((error, Notice) => {
    if (error) {
      console.log('Notice save error');
      console.log(error);
    } else {
      //총 공지사항 수 +1
      Pofolup.updateOne({}, {$inc:{totalNotice:1}}, (error, pofolupDB)=>{
        if (error){
          console.log(error);
        }else{
          next();
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
