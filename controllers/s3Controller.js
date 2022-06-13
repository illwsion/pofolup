const AWS = require('aws-sdk');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.s3Upload = (req, res, userEmail, filename) => {
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + userEmail + '/' + filename,
    'ACL': 'public-read',
    'Body': fs.createReadStream(__dirname + '/../uploads/' + filename),
  };
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

exports.s3Download = (req, res, userEmail, filename) => {
  console.log('s3Download');
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + userEmail + '/' + filename,
  };
  s3.getObject(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.download');
      console.log(err);
    } else {
      //다운로드 성공
      console.log('다운로드 성공');
      console.log(data);
      req.file = data.Body.toString();
      //console.log(req.file);
    }
  });
}

exports.s3Delete = (req, res, userEmail, filename) => {
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + userEmail + '/' + filename,
  };
  s3.deleteObject(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.delete');
      console.log(err);
    } else {
      //삭제 성공
    }
  });
};

exports.s3NoticeUpload = (req, res, filename) => {
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'notice/' + req.body.title + '/' + filename,
    'ACL': 'public-read',
    'Body': fs.createReadStream(__dirname + '/../uploads/' + filename),
  };
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
