const Category = require('./../models/category');
const Applicant = require('./../models/applicant');
const moment = require('moment-timezone');
exports.getAllCategories = (req, res, next)=>{
  Category.find({}, (error, categories)=>{
    if (error){
      console.log('error at getting categories');
      console.log(error);
    }
    else{
      req.categoriesData = categories;
    }
    next();
  });
};

exports.getAllTags = (req, res, next)=>{
  Category.find({categoryName: req.params.category}, (error, category)=>{
    if (error){
      console.log('error at getalltags');
      console.log(error);
    }
    else{
      req.Category = category[0];
    }
    next();
  });
}

exports.createCategory = (req, res, categoryName)=>{
  Category.find()
  .where('categoryName').equals(categoryName)
  .exec((error, category)=>{
    if(error){
      console.log('error at createcategory');
      console.log(error);
    } else{
      if (category.length == 0){

      } else{
        //console.log('이미 존재하는 카테고리입니다');
      }
    }
  });
  let newCategory = new Category({
    categoryName: req.body.categoryName,
  })
};

exports.createTag = (req, res, categoryName)=>{
  Category.find()
    .where('categoryName').equals(categoryName)
    .exec((error, category)=>{
      if (error){
        console.log('addtag error');
        console.log(error);
      }else{
        if (!category[0].hashTags.includes(req.body.newhashTag)){
          category[0].hashTags.push(req.body.newhashTag);
          category[0].save();
        }
      }
    });
  res.redirect('/adminPage/'+categoryName + '/1');
};

exports.deleteTag = (req, res, categoryName)=>{
  Category.find()
    .where('categoryName').equals(categoryName)
    .exec((error, category)=>{
      if (error){
        console.log('deleteTag error');
        console.log(error);
      }else{
        let index = category[0].hashTags.indexOf(req.params.tag);
        category[0].hashTags.splice(index, 1);
        category[0].save();
      }
    });
  res.redirect('/adminPage/'+categoryName + '/1');
}

exports.attachTag = async (req, res)=>{
  let username = "/applicants/";
  let numOfAdmin;

  await Applicant.find()
    .where('isAdmin').equals(true)
    .exec((error, admin)=>{
      if (error){
        console.log('query admin error');
      }
      else{
        numOfAdmin = admin.length;
      }
    });


  await Applicant.find({username: req.params.applicantEmail}, (error, applicant)=>{
    if (error){
      console.log('error at attachTag');
      console.log(error);
      res.render('errorPage');
    } else{
      username += applicant[0].username;
      let tagInfo = {
        taggerId: req.params.adminId,
        tag: req.params.tag
      };
      let numOfTag = 0;
      let alreadyExist = false;
      applicant[0].tagInfo.forEach((tagInfo, i) => {
        if (tagInfo.tag == req.params.tag){
          numOfTag++;
          if (tagInfo.taggerId == req.params.adminId){
            alreadyExist = true;
          }
        }
      });
      if (!alreadyExist){
        applicant[0].tagInfo.push(tagInfo);


      }
      else{
        //console.log('이미 태그를 누른 적 있음');
      }
      //tagInfo 검사해서 과반수 이상이고 이미 없으면 usertags에 추가
      if ((parseInt((numOfAdmin-1)/2) + 1) <= numOfTag + 1){
        if (applicant[0].userTags.indexOf(req.params.tag) == -1){
          applicant[0].userTags.push(req.params.tag);
        }else{
          //console.log('이미 있는 태그');
        }
      }
      applicant[0].save();
      res.redirect('/applicants/'+req.params.applicantEmail);
    }
  }).clone();


};

exports.detachTag = (req, res)=>{
  Applicant.updateOne({username: req.params.applicantEmail}, {
    $pull : {
      userTags: req.params.tag,
      tagInfo: {taggerId: req.params.adminId, tag: req.params.tag}
    }}, (error, applicant)=>{
    if (error){
      console.log('error at detachtag');
      console.log(error);
    } else{
      }
  });
  res.redirect('/applicants/'+req.params.applicantEmail);
};
