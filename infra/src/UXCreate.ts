const constants = require('./envparams.ts');
const {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand
} = require("@aws-sdk/client-s3");
const fs = require('fs');
const path = require('path');

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

// ======= helper functions ==========
function walkSync(currentDirPath, callback) {
	fs.readdirSync(currentDirPath).forEach(function (name) {
		var filePath = path.join(currentDirPath, name);
		var stat = fs.statSync(filePath);
		if (stat.isFile()) {
			callback(filePath, stat);
		} else if (stat.isDirectory()) {
			walkSync(filePath, callback);
		}
	});
}

// ====== create the S3 bucket and copy files =====
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

	//copy files
    walkSync(directoryToUpload, function(filePath, stat) {
        let bucketPath = filePath.substring(directoryToUpload.length+1);
        let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath)};
 
		try {
			const data = await AWSs3Client.send(new PutObjectCommand(uploadParams));
			console.log("Success. Bucket created.");
		} catch (err) {
			console.log("Error: ", err);
		}
	});
	
	//Setting the bucket as a static web host
	try {
		const data = await AWSs3Client.send(new GetBucketWebsiteCommand({ Bucket: bucketName}));
		console.log("Success. Bucket created.");
	} catch (err) {
		console.log("Error: ", err);
	}

}

/*

// Set the parameters.
const uploadParams = {
  Bucket: "BUCKET_NAME",
  // Specify the name of the new object. For example, 'index.html'.
  // To create a directory for the object, use '/'. For example, 'myApp/package.json'.
  Key: "OBJECT_NAME",
  // Content of the new object.
  Body: "BODY"
};

  try {
    const data = await s3.send(new PutObjectCommand(uploadParams));
    console.log(
        "Successfully uploaded object: " + uploadParams.Bucket + "/" + uploadParams.Key
    );
  } catch (err) {
    console.log("Error", err);
  }
	  
	  
	  
	  
  try {
    const data = await s3.send(new GetBucketWebsiteCommand({ Bucket: "BUCKET_NAME" }));
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }

*/

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