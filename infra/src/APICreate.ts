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
const {
    APIGatewayClient,
    CreateRestApiCommand,
	CreateResourceCommand,
	GetResourcesCommand
} = require("@aws-sdk/client-api-gateway");
const fs = require('fs');
const exec = require('await-exec');
const AdmZip = require('adm-zip');
const replace = require('replace-in-file');

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
/*		const iamclient = new IAMClient(config);
		const roleparams = {
			AssumeRolePolicyDocument: '{"Version": "2012-10-17","Statement": [{ "Effect": "Allow", "Principal": {"Service": "lambda.amazonaws.com"}, "Action": "sts:AssumeRole"}]}',
			RoleName: 'healthylinkx-lambda'
		};
		await iamclient.send(new CreateRoleCommand(roleparams));
		console.log("Success. IAM role created.");
		// wait a few seconds till the role is created. otherwise there is an error creating the lambda
		await sleep(10);

		//URL of the database
		const rdsclient = new RDSClient(config);
		//data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		//const endpoint = data.DBInstances[0].Endpoint.Address;
		const endpoint = 'temporal';
		console.log("DB endpoint: " + endpoint);

		// create contants.js with env values
		fs.copyFileSync(constants.ROOT+'/api/src/constants.template.js', constants.ROOT+'/api/src/constants.js');
		const options = {
			files: constants.ROOT+'/api/src/constants.js',
			from: ['ENDPOINT', 'DBUSER', 'DBPWD', 'ZIPCODEAPI', 'ZIPCODETOKEN'],
			to: [endpoint, constants.DBUSER, constants.DBPWD, constants.ZIPCODEAPI, constants.ZIPCODETOKEN]
		};
		await replace(options);
		console.log("Success. Constants updated.");
		
		// install api node language dependencies
		await exec(`cd ${constants.ROOT}/api/src; npm install ${nodedependencies}`);

		//package the lambdas (with zip)
		//taxonomy
		var file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/taxonomy.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/taxonomy.zip');		
		
		//providers
		var file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/providers.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/providers.zip');	
		
		//shortlist
		var file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/shortlist.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/shortlist.zip');	
		
		//transaction
		var file = new AdmZip();	
		file.addLocalFile(constants.ROOT+'/api/src/transaction.js');
		file.addLocalFile(constants.ROOT+'/api/src/constants.js');
		file.addLocalFile(constants.ROOT+'/api/src/package-lock.json');
		file.addLocalFolder(constants.ROOT+'/api/src/node_modules', 'node_modules');
		file.writeZip(constants.ROOT+'/api/src/transaction.zip');		

		//create the lambdas
		const lambda = new LambdaClient(config);		
		
		//create taxonomy lambda
		// read the lambda zip file  
		var filecontent = fs.readFileSync(constants.ROOT+'/api/src/taxonomy.zip');

		// Set the lambda parameters.
		var params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: 'taxonomy',
			Handler: 'taxonomy.handler',
			Role: 'arn:aws:iam::' + constants.AWS_ACCOUNT_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs12.x',
			Description: 'Taxonomy api lambda'
		};

		//create the lambda
		await lambda.send(new CreateFunctionCommand(params));
		console.log("Success. Taxonomy lambda created.");
	
		//create providers lambda
		// read the lambda zip file  
		var filecontent = fs.readFileSync(constants.ROOT+'/api/src/providers.zip');

		// Set the lambda parameters.
		var params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: 'providers',
			Handler: 'providers.handler',
			Role: 'arn:aws:iam::' + constants.AWS_ACCOUNT_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs12.x',
			Description: 'providers api lambda'
		};

		//create the lambda
		await lambda.send(new CreateFunctionCommand(params));
		console.log("Success. Providers lambda created.");

		//create shortlist lambda
		// read the lambda zip file  
		var filecontent = fs.readFileSync(constants.ROOT+'/api/src/shortlist.zip');

		// Set the lambda parameters.
		var params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: 'shortlist',
			Handler: 'shortlist.handler',
			Role: 'arn:aws:iam::' + constants.AWS_ACCOUNT_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs12.x',
			Description: 'shortlist api lambda'
		};

		//create the lambda
		await lambda.send(new CreateFunctionCommand(params));
		console.log("Success. Shortlist lambda created.");

		//create transaction lambda
		// read the lambda zip file  
		var filecontent = fs.readFileSync(constants.ROOT+'/api/src/transaction.zip');

		// Set the lambda parameters.
		var params = {
			Code: {
				ZipFile: filecontent
			},
			FunctionName: 'transaction',
			Handler: 'transaction.handler',
			Role: 'arn:aws:iam::' + constants.AWS_ACCOUNT_ID + ':role/healthylinkx-lambda',
			Runtime: 'nodejs12.x',
			Description: 'transaction api lambda'
		};

		//create the lambda
		await lambda.send(new CreateFunctionCommand(params));
		console.log("Success. Transaction lambda created.");
		
		// cleanup of files created	
		await fs.unlinkSync(constants.ROOT + '/api/src/taxonomy.zip');
		await fs.unlinkSync(constants.ROOT + '/api/src/providers.zip');
		await fs.unlinkSync(constants.ROOT + '/api/src/shortlist.zip');
		await fs.unlinkSync(constants.ROOT + '/api/src/transaction.zip');
		await fs.unlinkSync(constants.ROOT + '/api/src/package-lock.json');
		await fs.unlinkSync(constants.ROOT + '/api/src/constants.js');
		await fs.rmdirSync(constants.ROOT + '/api/src/node_modules', { recursive: true });
*/
		//create the api gateway
		const apigwclient = new APIGatewayClient(config);
		var data = await apigwclient.send(new CreateRestApiCommand({name: 'healthylinkx'}));
		const gwid = data.id;
		console.log("Success. API Gateway created.");

		// id of '/' path 
		var data = await apigwclient.send(new GetResourcesCommand({restApiId:gwid}));
		const rootpathid = data.items[0].id;
		
		//create the resource (/taxonomy)
		var data = await apigwclient.send(new CreateResourceCommand({parentId: rootpathid, pathPart: 'taxonomy', restApiId: gwid}));
		const taxonomyid = data.id;
		console.log("Success. /taxonomy created.");

		//create the method (GET)
		var data = await apigwclient.send(new PutMethodCommand({authorizationType: 'NONE', httpMethod: 'GET', resourceId: taxonomyid, restApiId: gwid}));
		console.log(data);
		

	} catch (err) {
		console.log("Error. ", err);
	}
}

/*



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
