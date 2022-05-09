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
  if (req.params.username) {
    targetName = req.params.username;
  } else if (req.body.username) {
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

exports.saveArticle = (req, res, applicantId) => {
  let fileArray = [];
  for (var i = 0; i < fileLength; i++) {
    fileArray.push(req.files[i].filename);
  }
  let newArticle = new Article({
    applicantId: applicantId,
    userEmail: req.body.username,
    files: fileArray,
    comment: req.body.comment,
    url: req.body.url,
    createDate: new Date().getTime(),
  });

  newArticle.save((error, result) => {
    if (error) {
      res.send(error);
    } else {
      //s3에 이미지 업로드
      for (var i = 0; i < req.files.length; i++) {
        s3Controller.s3Upload(req, res, req.files[i].filename);
      }
      Applicant.findById(applicantId, (error, applicant) => {
        if (error) {
          console.log(error);
        } else {
          applicant.articles.push(result._id);
          applicant.updateDate = new Date().getTime();
          applicant.save();
        }
      });
    }
  });
};

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
        Applicant.findById(article.applicantId, (error, applicant) => {
          if (error) {
            console.log(error);
          } else {
            if (applicant) {
              let index = applicant.articles.indexOf(article._id);
              if (index > -1) {
                applicant.articles.splice(index, 1);
                applicant.updateDate = new Date().getTime();
                applicant.save();
              }
            }
          }
        });
        //게시글에 연결된 파일들 삭제
        for (var i = 0; i < article.files.length; i++) {
          //aws에서 파일 삭제
          s3Controller.s3Delete(req, res, article.files[i]);
          //uploads/에서 파일 삭제
          if (fs.existsSync('./uploads/' + article.files[i])) {
            fs.unlinkSync('./uploads/' + article.files[i]);
          } else {
            //console.log("file doens't exist and skipped");
          }
          //console.log(fileArray);
        }
        //article 삭제
        Article.deleteOne({
          _id: article._id
        }, (error, result) => {
          console.log('article deleted result');
          console.log(result);
        });
      }
    }
  });
};
