const constants = require('./envparams.ts');
const {
	RDSClient,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const { 
	IAMClient, 
	CreateRoleCommand 
} = require("@aws-sdk/client-iam");
const {
    LambdaClient,
    CreateFunctionCommand
} = require("@aws-sdk/client-lambda");
const fs = require('fs');
const exec = require('await-exec');
const AdmZip = require('adm-zip');

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

//lamdba node dependencies
const nodedependencies = 'mysql2 axios';

// ======== helper function ============
function sleep(secs) {
	return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

// ====== create lambdas and API gateway =====
async function APICreate() {

	try {
		//create a IAM role under which the lambdas will run
		const roleparams = {
			AssumeRolePolicyDocument: '{"Version": "2012-10-17","Statement": [{ "Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}',
			RoleName: 'healthylinkx-lambda'
		};
		const iamclient = new IAMClient(config);
		//await iamclient.send(new CreateRoleCommand(roleparams));
		// wait a few seconds till the role is created. otherwise there is an error creating the lambda
		await sleep(10);
		console.log("Success. IAM role created.");

		//URL of the database
		const rdsclient = new RDSClient(config);
		//data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		//var endpoint = data.DBInstances[0].Endpoint.Address;
		//console.log("DB endpoint: " + endpoint);

		// create contants.js with env values
		
		// install api node language dependencies
		await exec(`cd ${constants.ROOT}/api/src; npm install ${nodedependencies}`);

		//package the lambdas (with zip)
		//taxonomy
		var file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/taxonomy.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.template.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/taxonomy.zip');		
		
		//providers
		file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/providers.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.template.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/providers.zip');	
		
		//shortlist
		file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/shortlist.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.template.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/srcshortlist.zip');	
		
		//transaction
		file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/transaction.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.template.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/transaction.zip');		

		//create the lambdas
		const lambda = new LambdaClient(config);		
		
		//create taxonomy lambda
		// read the lambda zip file  
		var filecontent = fs.readFileSync(constants.ROOT+'/api/src/taxonomy.zip', 'utf8')

		// Set the lambda parameters.
		var params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: 'taxonomy',
			Handler: 'taxonomy.handler',
			Role: 'arn:aws:iam::' + constants.AWS_ACCESS_KEY_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs12.x',
			Description: 'Taxonomy api lambda'
		};

		//create the lambda
		await lambda.send(new CreateFunctionCommand(params));
	
	} catch (err) {
		console.log("Error. ", err);
	}
}

/*

# create contants.js with env values
ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier healthylinkx-db --query "DBInstances[*].Endpoint.Address")
sed "s/ENDPOINT/$ENDPOINT/" $ROOT/api/src/constants.template.js > $ROOT/api/src/constants.js
sed -i "s/DBUSER/$DBUSER/" $ROOT/api/src/constants.js
sed -i "s/DBPWD/$DBPWD/" $ROOT/api/src/constants.js
sed -i "s/ZIPCODEAPI/$ZIPCODEAPI/" $ROOT/api/src/constants.js
sed -i "s/ZIPCODETOKEN/$ZIPCODETOKEN/" $ROOT/api/src/constants.js




#creating a providers lambda with the package
aws lambda create-function \
	--function-name providers \
	--runtime nodejs12.x \
	--handler providers.handler \
	--role arn:aws:iam::$AWS_ACCOUNT_ID:role/healthylinkx-lambda \
	--zip-file fileb://$ROOT/api/src/providers.zip


#creating a shortlist lambda with the package
aws lambda create-function \
	--function-name shortlist \
	--runtime nodejs12.x \
	--handler shortlist.handler \
	--role arn:aws:iam::$AWS_ACCOUNT_ID:role/healthylinkx-lambda \
	--zip-file fileb://$ROOT/api/src/shortlist.zip

#creating a transaction lambda with the package
aws lambda create-function \
	--function-name transaction \
	--runtime nodejs12.x \
	--handler transaction.handler \
	--role arn:aws:iam::$AWS_ACCOUNT_ID:role/healthylinkx-lambda \
	--zip-file fileb://$ROOT/api/src/transaction.zip

# cleanup
rm $ROOT/api/src/*.zip
rm $ROOT/api/src/package-lock.json
rm $ROOT/api/src/constants.js
rm -r $ROOT/api/src/node_modules

#create the REST apigateway
aws apigateway create-rest-api --name healthylinkx
APIID=$(aws apigateway get-rest-apis --query "items[?name==\`healthylinkx\`].id")
PARENTRESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/'].id")

#create the resource (taxonomy)
aws apigateway create-resource --rest-api-id $APIID --parent-id $PARENTRESOURCEID --path-part taxonomy
RESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/taxonomy'].id")

#create the method (GET)
aws apigateway put-method --rest-api-id $APIID --resource-id $RESOURCEID --http-method GET --authorization-type NONE

#link the lambda to the method
LAMBDAARN=$(aws lambda list-functions --query "Functions[?FunctionName==\`taxonomy\`].FunctionArn")  
aws apigateway put-integration --rest-api-id $APIID --resource-id $RESOURCEID \
    --http-method GET --type AWS_PROXY --integration-http-method POST \
    --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/${LAMBDAARN}/invocations

#allow apigateway to call the lambda
aws lambda add-permission --function-name taxonomy --action lambda:InvokeFunction --statement-id api-lambda --principal apigateway.amazonaws.com

#create the resource (providers)
aws apigateway create-resource --rest-api-id $APIID --parent-id $PARENTRESOURCEID --path-part providers
RESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/providers'].id")

#create the method (GET)
aws apigateway put-method --rest-api-id $APIID --resource-id $RESOURCEID --http-method GET --authorization-type NONE

#link the lambda to the method
LAMBDAARN=$(aws lambda list-functions --query "Functions[?FunctionName==\`providers\`].FunctionArn")  
aws apigateway put-integration --rest-api-id $APIID --resource-id $RESOURCEID \
    --http-method GET --type AWS_PROXY --integration-http-method POST \
    --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/${LAMBDAARN}/invocations

#allow apigateway to call the lambda
aws lambda add-permission --function-name providers --action lambda:InvokeFunction --statement-id api-lambda --principal apigateway.amazonaws.com

#create the resource (shortlist)
aws apigateway create-resource --rest-api-id $APIID --parent-id $PARENTRESOURCEID --path-part shortlist
RESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/shortlist'].id")

#create the method (GET)
aws apigateway put-method --rest-api-id $APIID --resource-id $RESOURCEID --http-method GET --authorization-type NONE

#link the lambda to the method
LAMBDAARN=$(aws lambda list-functions --query "Functions[?FunctionName==\`shortlist\`].FunctionArn")  
aws apigateway put-integration --rest-api-id $APIID --resource-id $RESOURCEID \
    --http-method GET --type AWS_PROXY --integration-http-method POST \
    --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/${LAMBDAARN}/invocations

#allow apigateway to call the lambda
aws lambda add-permission --function-name shortlist --action lambda:InvokeFunction --statement-id api-lambda --principal apigateway.amazonaws.com

#create the resource (transaction)
aws apigateway create-resource --rest-api-id $APIID --parent-id $PARENTRESOURCEID --path-part transaction
RESOURCEID=$(aws apigateway get-resources --rest-api-id ${APIID} --query "items[?path=='/transaction'].id")

#create the method (GET)
aws apigateway put-method --rest-api-id $APIID --resource-id $RESOURCEID --http-method GET --authorization-type NONE

#link the lambda to the method
LAMBDAARN=$(aws lambda list-functions --query "Functions[?FunctionName==\`transaction\`].FunctionArn")  
aws apigateway put-integration --rest-api-id $APIID --resource-id $RESOURCEID \
    --http-method GET --type AWS_PROXY --integration-http-method POST \
    --uri arn:aws:apigateway:$AWS_REGION:lambda:path/2015-03-31/functions/${LAMBDAARN}/invocations

#allow apigateway to call the lambda
aws lambda add-permission --function-name transaction --action lambda:InvokeFunction --statement-id api-lambda --principal apigateway.amazonaws.com

#deploy all
aws apigateway create-deployment --rest-api-id $APIID --stage-name prod

# URL of the api
echo https://$APIID.execute-api.$AWS_REGION.amazonaws.com/prod/taxonomy

*/

module.exports = APICreate;
