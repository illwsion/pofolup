const Applicant = require('./../models/applicant');
const Article = require('./../models/article');
const applicantController = require('./../controllers/applicantController');
const s3Controller = require('./../controllers/s3Controller');
const fs = require('fs');
const passport = require('passport');
let fileLength = 3;


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

exports.articleInit = (req, res, applicantId) =>{
  let newArticle = new Article({
    applicantId: applicantId,
    category: req.body.category,
    userEmail: req.body.username,
    comment: req.body.comment,
    url: req.body.url,
    createDate: new Date().getTime(),
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
          //그림작가 1개만 있을 경우
          req.body.category = 'illustrator';

          applicant.articles.push(article._id);
          if (applicant.categories.indexOf(req.body.category) == -1){
            console.log('카테고리 추가');
            applicant.categories.push(req.body.category);
          }else{
            console.log('카테고리 이미 있음');
          }
          applicant.updateDate = new Date().getTime();
          applicant.save();
        }
      });
    }
  });

}

exports.createArticle = (req, res, applicantId) => {
  let newArticle = new Article({
    applicantId: applicantId,
    category: req.body.category,
    userEmail: req.body.username,
    comment: req.body.comment,
    url: req.body.url,
    updateDate: new Date().getTime(),
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
      for (let i=0; i<article.fileDesc.length; i++){
        //업로드한 파일이 있다면
        if (req.files[i] != undefined){
          article.fileNames[i] = req.files[i][0].filename;
          s3Controller.s3Upload(req, res, req.body.username, req.files[i][0].filename);
          //원래 있던 것은 삭제
          if (req.articlesData[0].fileNames[i] != null){
            s3Controller.s3Delete(req, res, req.body.username, req.articlesData[0].fileNames[i]);
            console.log(req.articlesData[0].fileNames[i]+'삭제');
          }
          //uploads에 업로드된 파일 삭제?
        }else if (req.articlesData[0].fileNames[i] != null){
          //새로 올라오지 않았지만 이미 있을 경우 파일 연결만
          console.log('없지만 이미 있던 파일 연결');
          article.fileNames[i] = req.articlesData[0].fileNames[i];
        }

      }
      console.log('fileNames');
      console.log(article.fileNames);

      article.createDate = req.articlesData[0].createDate;
      article.save();

      Applicant.findById(applicantId, (error, applicant) => {
        if (error) {
          console.log(error);
        } else {
          //그림작가 1개만 있을 경우
          req.body.category = '그림작가';

          applicant.articles.push(article._id);
          if (applicant.categories.indexOf(req.body.category) == -1){
            //console.log('카테고리 추가');
            applicant.categories.push(req.body.category);
          }else{
            //console.log('카테고리 이미 있음');
          }
          applicant.updateDate = new Date().getTime();
          applicant.save();
        }
      });
    }
  });
};

exports.deleteArticle = (req, res, articleId) => {
  Article.findById(articleId, (error, article) => {
    let username = null;
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
            console.log('error at articles delete');
            console.log(error);
          } else{
            username = applicant.username;
          }
        });
        //게시글에 연결된 파일들 삭제
        for (var i = 0; i < article.fileNames.length; i++) {
          if (article.fileNames[i] != null){
            //aws에서 파일 삭제
            s3Controller.s3Delete(req, res, username, article.fileNames[i]);

            //uploads/에서 파일 삭제
            if (fs.existsSync('./uploads/' + article.fileNames[i])) {
              fs.unlinkSync('./uploads/' + article.fileNames[i]);
            } else {
              //console.log("file doens't exist and skipped");
            }
            //console.log(fileArray);
          }
        }
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
