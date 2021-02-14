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
		//delete the security group
		const ec2client = new EC2Client(config);
		
		var data = await ec2client.send(new DescribeSecurityGroupsCommand({ GroupNames: ['DBSecGroup']}));
		console.log(data);
		console.log(data.VpcSecurityGroupIds);
		return;
		
		await ec2client.send(new DeleteSecurityGroupCommand({ GroupId: "SECURITY_GROUP_ID" }));
		console.log("Success. " + "SECURITY_GROUP_ID" + " deleted.");		

		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
	
		// Delete the RDS instance
		await rdsclient.send(new DeleteDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db deletion requested.");

		//wait till the instance is deleted
		while(true) {
			data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
			//if (data.DBInstances[0].DBInstanceStatus  === 'deleting') break;
			console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			await sleep(30);
		}
		console.log("Success. healthylinkx-db deleted.");
	
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSDelete;

