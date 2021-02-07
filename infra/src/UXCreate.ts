const constants = require('./envparams.ts');
const {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand,
	PutBucketWebsiteCommand
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
		const data = await AWSs3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
		console.log("Success. " + bucketName + " bucket created.");
	} catch (err) {
		console.log("Error: ", err);
	}

	//copy files
    walkSync(directoryToUpload, async function(filePath, stat) {
        let bucketPath = filePath.substring(directoryToUpload.length+1);
        let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath), ACL:'public-read'};
 
		try {
			const data = await AWSs3Client.send(new PutObjectCommand(params));
			console.log("Success. " + bucketPath + " file copied to bucket " + bucketName);
		} catch (err) {
			console.log("Error: ", err);
		}
	});
	
	//Setting the bucket as a static web host
	const staticHostParams = {
		Bucket: bucketName,
		WebsiteConfiguration: {
			IndexDocument: {Suffix: "index.html"}
		}
	};

	try {
		const data = await AWSs3Client.send(new PutBucketWebsiteCommand(staticHostParams));
		console.log("Success. " + bucketName + " setup as a static web.");
	} catch (err) {
		console.log("Error: ", err);
	}
}

/*

var readOnlyAnonUserPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Sid: "AddPerm",
      Effect: "Allow",
      Principal: "*",
      Action: [
        "s3:GetObject"
      ],
      Resource: [
        ""
      ]
    }
  ]
};

// create selected bucket resource string for bucket policy
var bucketResource = "arn:aws:s3:::" + process.argv[2] + "/*";
readOnlyAnonUserPolicy.Statement[0].Resource[0] = bucketResource;

// convert policy JSON into string and assign into params
var bucketPolicyParams = {Bucket: process.argv[2], Policy: JSON.stringify(readOnlyAnonUserPolicy)};

// set the new policy on the selected bucket
s3.putBucketPolicy(bucketPolicyParams, function(err, data) {
  if (err) {
    // display error message
    console.log("Error", err);
  } else {
    console.log("Success", data);
  }
});


var bucketParams = {Bucket: process.argv[2]};

// call S3 to delete website configuration for selected bucket
s3.deleteBucketWebsite(bucketParams, function(error, data) {
  if (error) {
    console.log("Error", err);
  } else if (data) {
    console.log("Success", data);
  }
});


  try {
    const data = await s3.send(new DeleteBucketWebsiteCommand(bucketParams));
    console.log("Success", data);
  } catch (err) {
    console.log("Error", err);
  }
  
#include the API URL in the javascript code
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`healthylinkx\`].id")
sed "s/APIID/$APIID/" $ROOT/ux/src/js/constants.template.js > $ROOT/ux/src/js/constants.js

#installing UX using S3
aws s3 sync $ROOT/ux/src s3://healthylinkx --acl public-read

#this is the URL of the bucket
echo http://healthylinkx.s3-website-$AWS_REGION.amazonaws.com/

*/

module.exports = UXCreate;