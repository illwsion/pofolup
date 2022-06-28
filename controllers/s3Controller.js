/* 해당 코드는 안진형(cookise09@naver.com)에 의해 작성되었습니다 */
//AWS S3 담당
const AWS = require('aws-sdk');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();
//AWS 계정과 연결
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});
//이미지 업로드 (포트폴리오 및 프로필 이미지);
exports.s3Upload = (req, res, userEmail, filename) => {
  //저장경로 설정
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + userEmail + '/' + filename,
    'ACL': 'public-read',
    'Body': fs.createReadStream(__dirname + '/../uploads/' + filename),
  };
  //업로드
  s3.upload(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.upload');
      console.log(err);
    } else {
      //업로드 성공
      //로컬 파일은 삭제
      if (fs.existsSync(__dirname + '/../uploads/' + filename)) {
        fs.unlinkSync(__dirname + '/../uploads/' + filename);
      }
    }
  });
};
//이미지 삭제 (포트폴리오 및 프로필 이미지)
exports.s3Delete = (req, res, userEmail, filename) => {
  //경로 설정
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + userEmail + '/' + filename,
  };
  //삭제
  s3.deleteObject(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.delete');
      console.log(err);
    } else {
      //삭제 성공
    }
  });
};
//공지사항 업로드 시 이미지가 첨부되어있다면
exports.s3NoticeUpload = (req, res, filename) => {
  //저장경로 설정
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'notice/' + req.body.title + '/' + filename,
    'ACL': 'public-read',
    'Body': fs.createReadStream(__dirname + '/../uploads/' + filename),
  };
  //업로드
  s3.upload(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.upload');
      console.log(err);
    } else {
      //업로드 성공
      //로컬 파일은 삭제
      if (fs.existsSync(__dirname + '/../uploads/' + filename)) {
        fs.unlinkSync(__dirname + '/../uploads/' + filename);
      }
    }
  });
};
