const constants = require('./envparams.ts');
const {
	RDSClient,
	CreateDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	CreateSecurityGroupCommand,
	AuthorizeSecurityGroupIngressCommand
} = require("@aws-sdk/client-ec2");
const unzip = require('unzip');
const fs = require('fs');
const path = require('path');
const Importer = require('mysql-import');

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
async function DSCreate() {

	var rdsparams = {
		AllocatedStorage: 20, 
		BackupRetentionPeriod: 0,
		DBInstanceClass: 'db.t2.micro',
		DBInstanceIdentifier: 'healthylinkx-db',
		DBName: 'healthylinkx',
		Engine: 'mysql',
		MasterUsername: constants.DBUSER,
		MasterUserPassword: constants.DBPWD,
		PubliclyAccessible: true,
		VpcSecurityGroupIds: [' ']
	};

	try {
		//In order to have public access to the DB
		//we need to create a security group (aka firewall)with an inbound rule 
		//protocol:TCP, Port:3306, Source: Anywhere (0.0.0.0/0)
		const ec2client = new EC2Client(config);
		
		var data = await ec2client.send(new CreateSecurityGroupCommand({ Description: 'MySQL Sec Group', GroupName: 'DBSecGroup'}));
		rdsparams.VpcSecurityGroupIds[0] = data.GroupId;
		console.log("Success. " + rdsparams.VpcSecurityGroupIds[0] + " created.");
		
		const paramsIngress = {
			GroupId: data.GroupId,
			IpPermissions: [{
				IpProtocol: "tcp",
				FromPort: 3306,
				ToPort: 3306,
				IpRanges: [{ CidrIp: "0.0.0.0/0" }],
			}],
		};
		await ec2client.send( new AuthorizeSecurityGroupIngressCommand(paramsIngress));
		console.log("Success. " + rdsparams.VpcSecurityGroupIds[0] + " authorized.");

		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
	
		// Create the RDS instance
		await rdsclient.send(new CreateDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db created.");

		//wait till the instance is created
		//aws rds wait db-instance-available --db-instance-identifier healthylinkx-db
		while(true) {
			data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
			if (data.DBInstances[0].DBInstanceStatus  === 'available') break;
			console.log("Waiting. healthylinkx-db " + data.DBInstances[0].DBInstanceStatus);
			await sleep(30);
		}
		console.log("Success. healthylinkx-db provisioned.");
	
		//URL of the instance
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		var endpoint = data.DBInstances[0].Endpoint.Address;
		console.log("DB endpoint: " + endpoint);

		//unzip the file to dump on the database
		fs.createReadStream(constants.ROOT + '/datastore/src/healthylinkxdump.sql.zip')
			.pipe(unzip.Extract({ path: constants.ROOT + '/datastore/src' }));

		//load the data (and schema) into the database
		const mysqlparams = {
			host: endpoint,
			user: constants.DBUSER,
			password: constants.DBPWD,
			database: 'healthylinkx'
		};

		const importer = new Importer(mysqlparams);

		// New onProgress method, added in version 5.0!
		//importer.onProgress(progress=>{
		//	var percent = Math.floor(progress.bytes_processed / progress.total_bytes * 10000) / 100;
		//	console.log(`${percent}% Completed`);
		//});
		//await importer.import(constants.ROOT + '/datastore/src/healthylinkxdump.sql');
		console.log("Success. healthylinkx-db populated with data.");
		
		//delete the unzipped file
		fs.unlinkSync(constants.ROOT + '/datastore/src/healthylinkxdump.sql');
		
	} catch (err) {
		console.log("Error. ", err);
	}
}

module.exports = DSCreate;

