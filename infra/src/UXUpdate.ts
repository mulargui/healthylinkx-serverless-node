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
const directoryToUpload = constants.ROOT + '/ux/src';

// ======= helper functions ==========
// Recursively travels a folder tree
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
async function UXUpdate() {
/*  
#include the API URL in the javascript code
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`healthylinkx\`].id")
sed "s/APIID/$APIID/" $ROOT/ux/src/js/constants.template.js > $ROOT/ux/src/js/constants.js
*/
	try {
		// Create an S3 client service object
		const AWSs3Client = new S3Client(config);
		
		//copy files
		walkSync(directoryToUpload, async function(filePath, stat) {
			let bucketPath = filePath.substring(directoryToUpload.length+1);
			let params = {Bucket: bucketName, Key: bucketPath, Body: fs.readFileSync(filePath), ACL:'public-read'};
	 
			await AWSs3Client.send(new PutObjectCommand(params));
			console.log("Success. " + bucketPath + " file copied to bucket " + bucketName);
		} 
		
		console.log("URL of the bucket: http://" + bucketName + ".s3-website-" + constants.AWS_REGION + ".amazonaws.com/");
	} catch (err) {
			console.log("Error. ", err);
		}
	});
}

module.exports = UXUpdate;