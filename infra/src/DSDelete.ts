const constants = require('./envparams.ts');
const {
	RDSClient,
	DeleteDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	DescribeSecurityGroupsCommand,
	DeleteSecurityGroupCommand
} = require("@aws-sdk/client-ec2");

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ======== helper function ============
function sleep(secs) {
	return new Promise(resolve => setTimeout(resolve, secs * 1000));
}

// ====== create MySQL database and add data =====
async function DSDelete() {

	var rdsparams = {
		DBInstanceIdentifier: 'healthylinkx-db',
		SkipFinalSnapshot: true,
		DeleteAutomatedBackups: true
	};

	try {
		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
	
		// Delete the RDS instance
		await rdsclient.send(new DeleteDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db deletion requested.");

		//wait till the instance is deleted
		while(true) {
			try {
				await sleep(30);
				const data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
				console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			} catch (err) {
				break;
			}
		}
		console.log("Success. healthylinkx-db deleted.");
	
		//delete the security group
		const ec2client = new EC2Client(config);
		
		const data = await ec2client.send(new DescribeSecurityGroupsCommand({GroupNames: ['DBSecGroup']}));
		await ec2client.send(new DeleteSecurityGroupCommand({GroupId: data.SecurityGroups[0].GroupId }));
		console.log("Success. " + data.SecurityGroups[0].GroupId + " deleted.");		

	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSDelete;

