const AWS = require('aws-sdk');
const fs = require('fs');
const dotenv = require('dotenv');

dotenv.config();


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

exports.s3Upload = (req, res, filename) => {

  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + filename,
    'ACL': 'public-read',
    'Body': fs.createReadStream(__dirname + '/../uploads/' + filename),
  };
  s3.upload(param, (err, data) => {
    if (err) {
      console.log('something wrong at s3.upload');
      console.log(err);
    } else {
      //업로드 성공
    }
  });
};

exports.s3Delete = (req, res, filename) => {
  let param = {
    'Bucket': process.env.AWS_BUCKET,
    'Key': 'image/' + filename,
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
