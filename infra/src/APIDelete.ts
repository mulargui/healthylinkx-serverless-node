const constants = require('./envparams.ts');
const { 
	IAMClient, 
	DeleteRoleCommand 
} = require("@aws-sdk/client-iam");
const {
    LambdaClient,
    DeleteFunctionCommand
} = require("@aws-sdk/client-lambda");
const {
    APIGatewayClient,
    GetRestApisCommand,
	DeleteRestApiCommand
} = require("@aws-sdk/client-api-gateway");

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
async function APIDelete() {

	try {
		// delete the api gateway
		const apigwclient = new APIGatewayClient(config);
		const data = await apigwclient.send(new GetRestApisCommand({}));
		await apigwclient.send(new DeleteRestApiCommand({restApiId: data.items[0].id}));
		console.log("Success. API Gateway deleted.");
		
		//delete the lambdas
		const lambda = new LambdaClient(config);		
		await lambda.send(new DeleteFunctionCommand({FunctionName: 'taxonomy'}));
		console.log("Success. Taxonomy lambda deleted.");
		await lambda.send(new DeleteFunctionCommand({FunctionName: 'providers'}));
		console.log("Success. Providers lambda deleted.");
		await lambda.send(new DeleteFunctionCommand({FunctionName: 'shortlist'}));
		console.log("Success. Shortlist lambda deleted.");
		await lambda.send(new DeleteFunctionCommand({FunctionName: 'transaction'}));
		console.log("Success. Transaction lambda deleted.");

		//delete the IAM role
		const iamclient = new IAMClient(config);
		await iamclient.send(new DeleteRoleCommand({RoleName: 'healthylinkx-lambda'}));
		console.log("Success. Lambda role deleted.");
	
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = APIDelete;
