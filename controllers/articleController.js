const Article = require('./../models/article');


exports.getAllArticles = (req, res, next)=>{
  Article.find({}, (error, articles)=>{
    if (error){
        console.log(err);
    }else{
      req.data = articles;
      next();
    }
  });
};
exports.findArticle = (req, res, next)=>{
  Article.find({userEmail : req.params.email}, (error, articles)=>{
    if (error){
      console.log(err);
    }else{
      console.log('@@@@@@articles');
      console.log(articles);
      req.data = articles;
      next();
    }
  });

};

exports.saveArticle = (req, res, id)=>{
  let fileArray = [];
  console.log('saveArticle 발동');


  //console.log(req.files);
  for (var i=0; i<req.files.length; i++){
    fileArray.push(req.files[i].filename);
    console.log(fileArray);
  }
  let newArticle = new Article({
    userId : id,
    userEmail : req.body.email,
    files : fileArray,
    comment : req.body.comment,
    createDate : new Date().getTime(),
  });

  newArticle.save((error, result) =>{
    if (error) res.send(error);
    console.log("article save complete");
    console.log(result);

  });
};
exports.deleteApplicant = (req, res)=>{


}
