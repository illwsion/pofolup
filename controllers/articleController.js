/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */
//게시글(포트폴리오)에 관한 데이터 수정을 담당
const Applicant = require('./../models/applicant');
const Article = require('./../models/article');
const applicantController = require('./../controllers/applicantController');
const nodemailerController = require('./../controllers/nodemailerController.js')
const s3Controller = require('./../controllers/s3Controller');
const fs = require('fs');
const passport = require('passport');
const moment = require('moment-timezone');
const sanitize = require('sanitize-html');

//포트폴리오에서 받는 파일의 수
let fileLength = 6;

exports.getAllArticles = (req, res, next) => {
  Article.find({}, (error, articles) => {
    if (error) {
      console.log(err);
    } else {
      req.articlesData = articles;
      next();
    }
  });
};
//포트폴리오 검색. 자동으로 사용자의 이메일로 찾아서 검색한다
exports.findArticle = (req, res, next) => {
  let targetName;
  if (req.params.username != undefined) {
    targetName = req.params.username;
  } else if (req.body.username != undefined) {
    targetName = req.body.username;
  } else {
    console.log("no username found");
    return;
  }

  Article.find({
    userEmail: targetName
  }, (error, articles) => {
    if (error) {
      console.log(error);
    } else {
      req.articlesData = articles;
      next();
    }
  });

};
//기본 포트폴리오 생성
exports.articleInit = (req, res, applicantId) =>{
  let newArticle = new Article({
    applicantId: applicantId,
    category: req.body.category,
    userEmail: sanitize(req.body.username),
    url: sanitize(req.body.url),
    createDate: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm'),
  });
  newArticle.save((error, article) => {
    if (error){
      console.log('article initialize error');
      console.log(error);
    }
    else{
      let fileArray = [];
      for (let i=0; i<fileLength; i++){
        fileArray.push('구도 ' + (i+1));
      }
      article.fileDesc = fileArray;
      article.fileNames = new Array(fileLength);
      article.save();
      Applicant.findById(applicantId, (error, applicant) => {
        if (error) {
          console.log(error);
        } else {
          //카테고리 1개 고정일때
          req.body.category = 'illustrator';

          //사용자의 게시글 목록에 이 게시글 추가
          applicant.articles.push(article._id);

          //카테고리 1개라 지금은 필요없는 기능
          //만약 사용자가 새로운 카테고리의 포트폴리오를 등록했다면
          if (applicant.categories.indexOf(req.body.category) == -1){
            //카테고리 추가
            applicant.categories.push(req.body.category);
          }else{
            //카테고리 이미 있음
          }
          //사용자 업데이트 날짜 저장
          applicant.updateDate = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm');
          applicant.save();
        }
      });
    }
  });

}
//새로운 포트폴리오 생성 (수정하기 버튼)
exports.createArticle = (req, res, applicantId) => {
  let newArticle = new Article({
    applicantId: applicantId,
    category: req.body.category,
    userEmail: sanitize(req.body.username),
    url: sanitize(req.body.url),
    updateDate: moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm'),
  });

  newArticle.save((error, article) => {
    if (error) {
      console.log('article save error');
      console.log(error);
    } else {
      let fileArray = [];
      for (let i=0; i<fileLength; i++){
        fileArray.push('구도 ' + (i+1));
      }
      article.fileDesc = fileArray;
      article.fileNames = new Array(fileLength);

      //파일 업데이트
      for (let i=0; i<fileLength; i++){
        //업로드한 파일이 있다면
        if (req.files[i] != undefined){
          article.fileNames[i] = req.files[i][0].filename;
          s3Controller.s3Upload(req, res, req.body.username, req.files[i][0].filename);
          //원래 있던 것은 삭제
          if (req.articlesData[0].fileNames[i] != null){
            s3Controller.s3Delete(req, res, req.body.username, req.articlesData[0].fileNames[i]);
          }
        }else if (req.articlesData[0].fileNames[i] != null){
          //새로 올라오지 않았지만 이미 있을 경우 파일 연결만
          article.fileNames[i] = req.articlesData[0].fileNames[i];
        }

      }
      //포트폴리오 생성날짜
      article.createDate = req.articlesData[0].createDate;
      article.save();

      Applicant.findById(applicantId, (error, applicant) => {
        if (error) {
          console.log(error);
        } else {

          //6개 등록했을 경우 최종제출 tag 부여
          let fullApply = true;
          for (let i=0;i<6;i++){
            if (article.fileNames[i] == null){
              fullApply = false;
            }
          }
          if (fullApply){
            if (!applicant.userTags.includes('최종제출')){
              applicant.userTags.push('최종제출');
              nodemailerController.sendApplyMail(req, res, applicant);
            }
          }
          //그림작가 1개만 있을 경우
          req.body.category = '그림작가';

          applicant.articles.push(article._id);
          if (applicant.categories.indexOf(req.body.category) == -1){
            //console.log('카테고리 추가');
            applicant.categories.push(req.body.category);
          }else{
            //console.log('카테고리 이미 있음');
          }
          applicant.url = article.url;
          applicant.fileNames = article.fileNames;
          applicant.updateDate = moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm');
          applicant.save();
        }
      });
    }
  });
};
//포트폴리오 삭제
exports.deleteArticle = (req, res, articleId) => {
  Article.findById(articleId, (error, article) => {
    if (error) {
      console.log(error);
    } else {
      if (article == null) {
        console.log("article doesn't exist");
        return;
      } else {
        //연결된 유저에서 해당 게시글 id 삭제
        Applicant.updateOne({_id: article.applicantId}, {$pull : {articles: article._id}}, (error, applicant)=>{
          if (error){
            console.log('error at articles delete' + error);
          } else{
          }
        });

        //article 삭제
        Article.deleteOne({
          _id: article._id
        }, (error, result) => {
          if (error){
            console.log('error at delete article');
            console.log(error);
          }
        });
      }
    }
  });
};
