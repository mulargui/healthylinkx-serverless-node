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

// Set the AWS region and secrets
const config = {
	accessKeyId: constants.AWS_ACCESS_KEY_ID, 
	secretAccessKey: constants.AWS_SECRET_ACCESS_KEY, 
	region: constants.AWS_REGION
};

// ====== create the S3 bucket and copy files =====
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
		/*
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
		data = await ec2client.send( new AuthorizeSecurityGroupIngressCommand(paramsIngress));
		console.log("Success. " + rdsparams.VpcSecurityGroupIds[0] + " authorized.");

		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
	
		// Create the RDS instance
		data = await rdsclient.send(new CreateDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db created.");
*/
		//URL of the instance
		var data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		console.log(data.DBInstances[0].Endpoint.Address);

		//wait till the instance is created
		//aws rds wait db-instance-available --db-instance-identifier healthylinkx-db
		console.log("Success. healthylinkx-db provisioned.");
		
		//unzip de data file
		fs.createReadStream(constants.ROOT + '/datastore/src/healthylinkxdump.sql.zip')
			.pipe(unzip.Extract({ path: constants.ROOT + '/datastore/src' }));

/*
#load the data (and schema) into the database
mysql -h $ENDPOINT -u $DBUSER -p$DBPWD healthylinkx < $ROOT/datastore/src/healthylinkxdump.sql

#delete the unzipped file
rm $ROOT/datastore/src/healthylinkxdump.sql
*/
	} catch (err) {
		console.log("Error: ", err);
	}
}

module.exports = DSCreate;

