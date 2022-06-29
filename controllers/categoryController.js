/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */
//카테고리와 태그에 관한 데이터 수정을 담당
const Category = require('./../models/category');
const Applicant = require('./../models/applicant');
const moment = require('moment-timezone');

const s3Controller = require('./../controllers/s3Controller');

//포트폴리오에서 받는 파일의 수
let fileLength = 6;

//모든 카테고리의 데이터를 불러온다
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
//해당 카테고리의 모든 태그 정보를 불러온다
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
//새로운 카테고리를 생성한다
//나중에 카테고리를 추가할 경우 해당 기능에 연결되는 버튼만 만들면 된다
exports.createCategory = (req, res, categoryName)=>{
  Category.find()
  .where('categoryName').equals(categoryName)
  .exec((error, category)=>{
    if(error){
      console.log('error at createcategory' + error);
    } else{
      if (category.length == 0){

      } else{
        //이미 존재하는 카테고리
      }
    }
  });
  let newCategory = new Category({
    categoryName: req.body.categoryName,
  })
};

//카테고리를 수정한다
exports.updateCategory = (req, res, categoryName)=>{
  console.log('req.body');
  console.log(req.body);
  console.log('req.art')

  Category.find()
  .where('categoryName').equals(categoryName)
  .exec((error, category)=>{
    if(error){
      console.log('error at updateCategory' + error);
      console.log(error);
    } else{
      if (category.length == 0){
        //카테고리가 존재하지 않음
      } else{
        let fileArray = [];
        for (let i=0; i<fileLength; i++){
          fileArray.push(req.body.fileDesc + (i+1));
        }
        category[0].fileDesc = fileArray;

        //파일 업데이트 이거 수정해야함
        for (let i=0; i<fileLength; i++){
          //업로드한 파일이 있다면
          if (req.files[i] != undefined){
            //원래 있던 것은 삭제
            console.log('새로운 파일');
            console.log(req.files[i]);
            console.log('원래 있는 파일');
            console.log(category[0].fileNames[i]);
            if (category[0].fileNames[i] != null){
              s3Controller.s3CategoryDelete(req, res, i, category[0].fileNames[i]);
            }
            //새로운 파일로 업데이트
            category[0].fileNames[i] = req.files[i][0].filename;
            s3Controller.s3CategoryUpload(req, res, i, req.files[i][0].filename);
          }
          //파일 설명 업데이트
          category[0].fileDesc[i] = req.body.fileDesc[i]
        }
        for (let i=0;i<2;i++){
          category[0].categoryDesc[i] = req.body.categoryDesc[i];
        }

        category[0].save();
      }
    }
  });

};

//새로운 태그 생성
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
//카테고리에서 태그 삭제
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
//사용자에게 태그 부여
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
      //태그에 이미 투표했는지 검사
      let alreadyExist = false;
      applicant[0].tagInfo.forEach((tagInfo, i) => {
        if (tagInfo.tag == req.params.tag){
          numOfTag++;
          if (tagInfo.taggerId == req.params.adminId){
            alreadyExist = true;
          }
        }
      });
      //태그에 아직 투표한 적 없다면 반영
      if (!alreadyExist){
        applicant[0].tagInfo.push(tagInfo);
      }
      //tagInfo 검사해서 해당 태그에 투표한 관리자가 과반수 이상이면 usertags에 추가
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
//사용자에게서 태그 제거
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
