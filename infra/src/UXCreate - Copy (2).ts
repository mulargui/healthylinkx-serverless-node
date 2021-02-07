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

//helper function to upload a dir to S3
async function uploadDir(s3Path: string, bucketName: string) {
  const s3 = new S3();

  // Recursive getFiles from
  // https://stackoverflow.com/a/45130990/831465
  async function getFiles(dir: string): Promise<string | string[]> {
    const dirents = await fs.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(
      dirents.map((dirent) => {
        const res = path.resolve(dir, dirent.name);
        return dirent.isDirectory() ? getFiles(res) : res;
      })
    );
    return Array.prototype.concat(...files);
  }

  const files = (await getFiles(s3Path)) as string[];
  const uploads = files.map((filePath) =>
    s3
      .putObject({
        Key: path.relative(s3Path, filePath),
        Bucket: bucketName,
        Body: fs.createReadStream(filePath),
      })
      .promise()
  );
  return Promise.all(uploads);
}

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
	
	try {
		await uploadDir(path.resolve("/home/cloudshell-user/healthylinkx-serverless-node/ux/src"), bucketName);
		console.log("Success. Files uploaded.");
	} catch (err) {
		console.log("Error: ", err);
	}
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