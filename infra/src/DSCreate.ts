const constants = require('./envparams.ts');
const {
	RDSClient,
	CreateDBInstanceCommand,
	DescribeDBInstancesCommand
} = require("@aws-sdk/client-rds");
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
/*  
# In order to have public access to the DB
# we need to create a security group (aka firewall)with an inbound rule 
# protocol:TCP, Port:3306, Source: Anywhere (0.0.0.0/0)
aws ec2 create-security-group --group-name DBSecGroup --description "MySQL Sec Group"
aws ec2 authorize-security-group-ingress \
	--group-name DBSecGroup \
	--protocol tcp \
	--port 3306 \
	--cidr 0.0.0.0/0

SGID=$(aws ec2 describe-security-groups --group-names DBSecGroup --query 'SecurityGroups[*].[GroupId]')
*/
	// Create an RDS client service object
	const client = new RDSClient(config);
	
	// Create the RDS instance
/*    const params = {
		AllocatedStorage: 20, 
		BackupRetentionPeriod: 0,
		DBInstanceClass: 'db.t2.micro',
		DBInstanceIdentifier: 'healthylinkx-db',
		DBName: 'healthylinkx',
		Engine: 'mysql',
		MasterUsername: constants.DBUSER,
		MasterUserPassword: constants.DBPWD,
		PubliclyAccessible: true
		//VpcSecurityGroupIds: ['']
	};
	try {
		const data = await client.send(new CreateDBInstanceCommand(params));
		console.log("Success. healthylinkx-db created.");
		console.log(data);
	} catch (err) {
		console.log("Error: ", err);
	}*/

	try {
		const data = await client.send(new DescribeDBInstancesCommand({DBInstanceIdentifier: 'healthylinkx-db'}));
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

#RDS instance endpoint
ENDPOINT=$(aws rds describe-db-instances --db-instance-identifier healthylinkx-db --query "DBInstances[*].Endpoint.Address")
	
#unzip de data file
unzip -o $ROOT/datastore/src/healthylinkxdump.sql -d $ROOT/datastore/src

#load the data (and schema) into the database
mysql -h $ENDPOINT -u $DBUSER -p$DBPWD healthylinkx < $ROOT/datastore/src/healthylinkxdump.sql

#delete the unzipped file
rm $ROOT/datastore/src/healthylinkxdump.sql

*/