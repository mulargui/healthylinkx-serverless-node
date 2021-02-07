const constants = require('./envparams.ts');
const {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand
} = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');
//const readdir = require("recursive-readdir");

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// Set the bucket parameters
const bucketName = "healthylinkx";
const bucketParams = { Bucket: bucketName };

const directoryToUpload = '/home/cloudshell-user/healthylinkx-serverless-node/ux/src';

// ===== helper functions =======
// get file paths
const filePaths = [];
const getFilePaths = (dir) => {
  fs.readdirSync(dir).forEach(function (name) {
    const filePath = path.join(dir, name);
    const stat = fs.statSync(filePath);
    if (stat.isFile()) {
      filePaths.push(filePath);
    } else if (stat.isDirectory()) {
      getFilePaths(filePath);
    }
  });
};

// upload to S3
const uploadToS3 = (s3, dir, path) => {
  return new Promise((resolve, reject) => {
    const key = path.split(`${dir}/`)[1];
    const params = {
      Bucket: bucketName,
      Key: key,
      Body: fs.readFileSync(path),
    };
    s3.putObject(params, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`uploaded ${params.Key} to ${params.Bucket}`);
        resolve(path);
      }
    });
  });
};

async function UXCreate() {
	// Create an S3 client service object
	const AWSs3Client = new S3Client(config);
	
	// Create S3 bucket
	try {
		const data = await AWSs3Client.send(new CreateBucketCommand(bucketParams));
		console.log("Success. Bucket created.");
	} catch (err) {
		console.log("Error: ", err);
	}

	getFilePaths(directoryToUpload);

const uploadPromises = filePaths.map((path) =>
  uploadToS3(AWSs3Client, directoryToUpload, path)
);

Promise.all(uploadPromises)
  .then((result) => {
    console.log('uploads complete');
    console.log(result);
  })
  .catch((err) => console.error(err));

}

/*
#include the API URL in the javascript code
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`healthylinkx\`].id")
sed "s/APIID/$APIID/" $ROOT/ux/src/js/constants.template.js > $ROOT/ux/src/js/constants.js

#installing UX using S3
aws s3api create-bucket --bucket healthylinkx
aws s3 sync $ROOT/ux/src s3://healthylinkx --acl public-read
aws s3 website s3://healthylinkx/ --index-document index.html

#this is the URL of the bucket
echo http://healthylinkx.s3-website-$AWS_REGION.amazonaws.com/

*/

module.exports = UXCreate;