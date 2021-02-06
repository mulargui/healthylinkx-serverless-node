const constants = require('./envparams.ts');
const {
	S3Client,
	PutObjectCommand,
	CreateBucketCommand
} = require("@aws-sdk/client-s3");

// Set the AWS region and secrets
var config = new AWS.Config({
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: contants.AWS_REGION
});


// Set the bucket parameters
const bucketName = "healthylinkx";
const bucketParams = { Bucket: bucketName };

// Create name for uploaded object key
const keyName = "hello_world.txt";
const objectParams = { Bucket: bucketName, Key: keyName, Body: "Hello World!" };

// Create an S3 client service object
const s3 = new S3Client();

const run = async () => {
	// Create S3 bucket
	try {
		const data = await s3.send(new CreateBucketCommand(bucketParams));
		console.log("Success. Bucket created.");
	} catch (err) {
		console.log("Error: ", err);
	}
	try {
		const results = await s3.send(new PutObjectCommand(objectParams));
		console.log("Successfully uploaded data to " + bucketName + "/" + keyName);
	} catch (err) {
		console.log("Error: ", err);
	}
};
run();
