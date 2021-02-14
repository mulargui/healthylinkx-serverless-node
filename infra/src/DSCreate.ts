const constants = require('./envparams.ts');
const {
	RDSClient,
	CreateDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
const {
	EC2Client,
	DescribeVpcsCommand,
	CreateSecurityGroupCommand,
	AuthorizeSecurityGroupIngressCommand,
} = require("@aws-sdk/client-ec2");
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
const directoryToUpload = constants.ROOT + '/ux/src';

// ====== create the S3 bucket and copy files =====
async function DSCreate() {

	const rdsparams = {
		AllocatedStorage: 20, 
		BackupRetentionPeriod: 0,
		DBInstanceClass: 'db.t2.micro',
		DBInstanceIdentifier: 'healthylinkx-db',
		DBName: 'healthylinkx',
		Engine: 'mysql',
		MasterUsername: constants.DBUSER,
		MasterUserPassword: constants.DBPWD,
		PubliclyAccessible: true
		//VpcSecurityGroupIds: []
	};


	try {
		//In order to have public access to the DB
		//we need to create a security group (aka firewall)with an inbound rule 
		//protocol:TCP, Port:3306, Source: Anywhere (0.0.0.0/0)
		const ec2client = new EC2Client(config);
		
		const data = await ec2client.send(new CreateSecurityGroupCommand({ Description: 'MySQL Sec Group', GroupName: 'DBSecGroup'}));
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

		// Create an RDS client service object
		const rdsclient = new RDSClient(config);
	
		// Create the RDS instance
		data = await rdsclient.send(new CreateDBInstanceCommand(rdsparams));
		console.log("Success. healthylinkx-db created.");
		console.log(data.DBInstances[0].Endpoint.Address);

		//wait till the instance is created
		
		//URL of the instance
		data = await rdsclient.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
		console.log(data.DBInstances[0].Endpoint.Address);

	} catch (err) {
		console.log("Error: ", err);
	}
}

module.exports = DSCreate;

/*

#wait till the instance is provisioned
aws rds wait db-instance-available \
    --db-instance-identifier healthylinkx-db
echo "MySQL provisioned!"

#unzip de data file
unzip -o $ROOT/datastore/src/healthylinkxdump.sql -d $ROOT/datastore/src

#load the data (and schema) into the database
mysql -h $ENDPOINT -u $DBUSER -p$DBPWD healthylinkx < $ROOT/datastore/src/healthylinkxdump.sql

#delete the unzipped file
rm $ROOT/datastore/src/healthylinkxdump.sql

*/