var constants = require("./constants.js");
const mysql = require('mysql2/promise');

function ServerReply (code, message){
	return {
		"statusCode": code,
		"headers": {
			"Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token",
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Methods": "OPTIONS,GET"
		},
		"body": JSON.stringify(message)
	};
}

var db = mysql.createPool({
	host:constants.host,
	user:constants.user,
	password:constants.password,
	database:constants.database
});

exports.handler = async (event) => {
	if (!event.queryStringParameters)
		return ServerReply (204, {"error": "no transaction id"});

	var id = event.queryStringParameters.id;

 	//check params
 	if(!id) return ServerReply (204, {"error": "no transaction id"});
	
	//retrieve the providers
	var query = "SELECT * FROM transactions WHERE (id = '"+id+"')";
	try {
		[rows,fields] = await db.query(query);

		if (rows.length <= 0) return ServerReply (204, {"error": query});

		//get the providers
		var npi1 = rows[0].NPI1;
		var npi2 = rows[0].NPI2;
		var npi3 = rows[0].NPI3;
	
		//get the details of the providers
		query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street, Provider_Full_City, Provider_Business_Practice_Location_Address_Telephone_Number FROM npidata2 WHERE ((NPI = '"+npi1+"')";
		if(npi2) query += "OR (NPI = '"+npi2+"')";
		if(npi3) query += "OR (NPI = '"+npi3+"')";
		query += ")";

		[rows,fields] = await db.query(query);
		
		return ServerReply(200, rows);
	} catch(err) {
		return ServerReply (500, 'db.query: ' {"error": query + '#' + err});
	}
}; 