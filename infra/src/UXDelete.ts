const constants = require('./envparams.ts');
const {
	S3Client,
	ListObjectsCommand,
	DeleteObjectCommand,
	DeleteBucketCommand
} = require("@aws-sdk/client-s3");

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// Set the bucket parameters
const bucketName = "healthylinkx";

// ====== create the S3 bucket and copy files =====
async function UXDelete() {
	// Create an S3 client service object
	const AWSs3Client = new S3Client(config);
  
	// remove all files
	try {
		const {Contents} = await AWSs3Client.send(new ListObjectsCommand({ Bucket: bucketName }));
		if (Contents.length > 0) {
			for (const value of Contents) {
				await AWSs3Client.send(new DeleteObjectCommand({ Bucket: bucketName, Key: value.Key})); 
				console.log("Success: " + value.Key + " deleted.");
			}
		}
 		console.log("Success: " + bucketName + " emptied.");
	}catch (err) {
		console.log("Error: ", err);
	}
	
	// Delete S3 bucket
	try {
		await AWSs3Client.send(new DeleteBucketCommand({ Bucket: bucketName }));
		console.log("Success: " + bucketName + " bucket deleted.");
	} catch (err) {
		console.log("Error: ", err);
	}
}

module.exports = UXDelete;