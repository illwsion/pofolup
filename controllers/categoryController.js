const Category = require('./../models/category');
const Applicant = require('./../models/applicant');

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

exports.CreateCategory = (req, res, categoryName)=>{
  Category.find()
  .where('categoryName').equals(categoryName)
  .exec((error, category)=>{
    if(error){
      console.log('error at createcategory');
      console.log(error);
    } else{
      console.log('found category');
      console.log(category);
      if (category.length == 0){

      }
    }
  });
  let newCategory = new Category({
    categoryName: req.body.categoryName,
  })
};

exports.AddTag = (req, res, categoryName)=>{
  Category.find()
    .where('categoryName').equals(categoryName)
    .exec((error, category)=>{
      if (error){
        console.log('addtag error');
        console.log(error);
      }else{
        if (!category.hashTags.includes(req.params.createTag)){
          category.hashTags.push(req.params.createTag);
          category.save();
        }
      }
    });
};



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
        console.log('query admin success');
        console.log(admin.length);
        numOfAdmin = admin.length;
      }
    });


  await Applicant.findById(req.params.applicantId, (error, applicant)=>{
    if (error){
      console.log('error at attachTag');
      console.log(error);
      res.render('errorPage');
    } else{
      username += applicant.username;
      let tagInfo = {
        taggerId: req.params.adminId,
        tag: req.params.tag
      };
      let numOfTag = 0;
      let alreadyExist = false;
      applicant.tagInfo.forEach((tagInfo, i) => {
        if (tagInfo.tag == req.params.tag){
          numOfTag++;
          if (tagInfo.taggerId == req.params.adminId){
            alreadyExist = true;
          }
        }
      });
      if (!alreadyExist){
        applicant.tagInfo.push(tagInfo);
        applicant.updateDate = new Date().getTime();
        //tagInfo 검사해서 과반수 이상이고 이미 없으면 usertags에 추가
        if ((parseInt((numOfAdmin-1)/2) + 1) <= numOfTag + 1){
          if (applicant.userTags.indexOf(req.params.tag) == -1){
            applicant.userTags.push(req.params.tag);
          }else{
            console.log('이미 있는 태그');
          }
        }
        applicant.save();
      }
      else{
        //console.log('이미 태그를 누른 적 있음');
      }
      res.redirect(username);
    }
  }).clone();


};
