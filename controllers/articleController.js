const Applicant = require('./../models/applicant');
const Article = require('./../models/article');
const applicantController = require('./../controllers/applicantController');
const fs = require('fs');

exports.getAllArticles = (req, res, next)=>{
  Article.find({}, (error, articles)=>{
    if (error){
        console.log(err);
    }else{
      req.articlesData = articles;
      next();
    }
  });
};
exports.findArticle = (req, res, next)=>{
  let targetName;
  if (req.params.username){
    targetName = req.params.username;
  }else if(req.body.username){
    targetName = req.body.username;
  }else{
    console.log("no userName found");
    return;
  }

  Article.find({userEmail : targetName}, (error, articles)=>{
    if (error){
      console.log(error);
    }else{
      //console.log('@@@@@@articles');
      //console.log(articles);
      req.articlesData = articles;
      next();
    }
  });

};

exports.saveArticle = (req, res, applicantId)=>{
  let fileArray = [];
  console.log('saveArticle 발동');
  for (var i=0; i<req.files.length; i++){
    fileArray.push(req.files[i].filename);
  }
  let newArticle = new Article({
    applicantId : applicantId,
    userEmail : req.body.username,
    files : fileArray,
    comment : req.body.comment,
    url : req.body.url,
    createDate : new Date().getTime(),
  });

  newArticle.save((error, result) =>{
    console.log('result@@@@@@@@@@@@@@@@@@@@@@@');
    console.log(result);
    if (error){
      res.send(error);
    }
    else{
      Applicant.findById(applicantId, (error, applicant)=>{
        if (error){
          console.log(error);
        }
        else{
          console.log('current user@@@@@@@@@@@@');
          console.log(applicant);
          applicant.articles.push(result._id);
          applicant.updateData = new Date().getTime();
          applicant.save();
        }
      })
    }
  });
};

exports.deleteArticle = (req, res, articleId)=>{
  console.log(articleId);
  Article.findById(articleId, (error, article)=>{
    if (error){
      console.log(error);
      next()
    }else{
      if (article == null){
        console.log("article doesn't exist");
        return;
      }
      else{
        //연결된 유저에서 해당 게시글 id 삭제
        Applicant.findById(article.applicantId, (error, applicant)=>{
          if (error){
            console.log(error);
          }
          else{
            let index = applicant.articles.indexOf(article._id);
            if (index > -1){
              applicant.articles.splice(index, 1);
              applicant.updateData = new Date().getTime();
              //user의 썸네일 업데이트? 추가기능. 아예 함수로 따로 만들어야 할듯
              applicant.save();
            }
          }
        })
        //게시글에 연결된 파일들 삭제
        for (var i=0; i<article.files.length; i++){
          if (fs.existsSync('./uploads/' + article.files[i])){
            fs.unlinkSync('./uploads/' + article.files[i]);
          }
          else{
            console.log("file doens't exist and skipped");
          }
          //console.log(fileArray);
        }
        //article 삭제
        Article.deleteOne({_id : article._id}, (error, result)=>{
          console.log('article deleted result');
          console.log(result);
        });
      }
    }
  });
};
