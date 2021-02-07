const constants = require('./envparams.ts');
const {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand
} = require("@aws-sdk/client-s3");
const s3 = require('s3');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// Set the bucket parameters
const bucketName = "healthylinkx";
const bucketParams = { Bucket: bucketName };

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
	
	// using the S3 package to sync a folder
	var client = s3.createClient({s3Client: AWSs3Client});
	var params = {
		localDir: "/home/cloudshell-user/healthylinkx-serverless-node/ux/src",
		deleteRemoved: true, 
		s3Params: {
			Bucket: bucketName,
			Prefix: "/"
			// See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
		}
	};
	var uploader = client.uploadDir(params);
	uploader.on('error', function(err) {
		console.error("unable to sync:", err.stack);
	});
	uploader.on('end', function() {
		console.log("done uploading");
	});
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