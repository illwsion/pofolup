/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */
//공지사항 담당
const Applicant = require('./../models/applicant');
const Contact = require('./../models/contact');
const Notice = require('./../models/notice');
const Pofolup = require('./../models/pofolup');
const applicantController = require('./../controllers/applicantController');
const s3Controller = require('./../controllers/s3Controller');
const nodemailerController = require('./../controllers/nodemailerController');

const moment = require('moment-timezone');


//총 공지사항 수 조회
exports.getTotalNotice = (req, res, next) => {
  Pofolup.find({}, (error, pofolupDB)=>{
    if (error){
      console.log('error at getTotalNotice! '+error)
    }else{
      req.totalNotice = pofolupDB[0].totalNotice;
    }
    next();
  });
};
//모든 공지사항의 데이터 검색
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
//공지사항 생성 (업로드 버튼)
exports.createNotice = (req, res, next) => {
  //현재 공지사항 수
  let currentNotice = req.totalNotice;
  currentNotice = ('0000'+currentNotice).slice(-4);
  //새로운 공지사항 생성
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
      //업로드된 이미지가 있다면
      if (req.files.length != 0){
        Notice.file = req.files[0].filename;
        //s3에 이미지 업로드
        s3Controller.s3NoticeUpload(req, res, req.files[0].filename);
        Notice.save();
      }

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
//공지사항 삭제
exports.deleteNotice = (req, res, noticeNumber) => {
  Notice.find({noticeNumber: noticeNumber}, async (error, notice) => {
    if (error) {
      console.log('error at deleteNotice' + error);
    } else {
      //이미지 삭제. 일단 남겨두는 쪽으로
      //지울거면 s3Controller에서 s3NoticeDelete 함수 작성해줘야한다
      //s3Controller.s3Delete(req, res, applicant.username, applicant.file);
      //공지사항 삭제
      Notice.deleteOne({
        _id: notice[0]._id
      }, (error, result) => {
        if (error) {
          console.log('error at deleteNotice');
          console.log(error);
        } else {
        }
      });
    }
  });
};

//공지사항 조회
exports.findNotice = (req, res, next) => {
  let targetName;
  Notice.find({
    noticeNumber: req.params.noticeNumber
  }, (error, notices) => {
    if (error) {
      console.log(error);
    } else {
      req.noticesData = notices;
      next();
    }
  });
};

//제휴문의
//총 제휴문의 수 조회
exports.getTotalContact = (req, res, next) => {
  Pofolup.find({}, (error, pofolupDB)=>{
    if (error){
      console.log('error at getTotalContact! '+error)
    }else{
      req.totalContact = pofolupDB[0].totalContact;
    }
    next();
  });
};
//모든 제휴문의 데이터 검색
exports.getAllContacts = (req, res, next) => {
  Contact.find({}, (error, contacts) => {
    if (error) {
      console.log(err);
    } else {
      req.contactsData = contacts;
      next();
    }
  });
};
//제휴문의 생성 (보내기 버튼)
exports.createContact = (req, res, next) => {
  //현재 제휴문의 수
  let currentContact = req.totalContact;
  currentContact = ('0000'+currentContact).slice(-4);
  //새로운 제휴문의 생성
  let newContact = new Contact({
    contactNumber: currentContact,
    companyName: req.body.companyname,
    enquireName: req.body.enquirename,
    phone: req.body.phone,
    email: req.body.email,
    item: req.body.item,
    content: req.body.content,
    createDate: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm'),
  });

  newContact.save((error, Notice) => {
    if (error) {
      console.log('Contact save error' + error);
    } else {
      //총 제휴문의 수 +1
      Pofolup.updateOne({}, {$inc:{totalContact:1}}, (error, pofolupDB)=>{
        if (error){
          console.log(error);
        }else{
          next();
        }
      });
    }
  });
};
//제휴문의 삭제
exports.deleteContact = (req, res, contactNumber) => {
  Contact.find({contactNumber: contactNumber}, async (error, contact) => {
    if (error) {
      console.log('error at deleteContact' + error);
    } else {
      //제휴문의 삭제
      Contact.deleteOne({
        _id: contact[0]._id
      }, (error, result) => {
        if (error) {
          console.log('error at deleteContact' + error);
        } else {
        }
      });
    }
  });
};
//제휴문의 조회
exports.findContact = (req, res, next) => {
  let targetName;
  Contact.find({
    contactNumber: req.params.contactNumber
  }, (error, contacts) => {
    if (error) {
      console.log(error);
    } else {
      req.contactsData = contacts;
      next();
    }
  });
};
