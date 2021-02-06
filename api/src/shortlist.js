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
		return ServerReply (204, {"error": "no NPI requested"});

	var npi1 = event.queryStringParameters.NPI1;
	var npi2 = event.queryStringParameters.NPI2;
	var npi3 = event.queryStringParameters.NPI3;

	//save the selection
	var query = "INSERT INTO transactions VALUES (DEFAULT,DEFAULT,'"+ npi1 +"','"+ npi2 +"','"+npi3 +"')";
	try {
		[rows,fields] = await db.query(query);
		
		//keep the transaction number
		var transactionid= rows.insertId;
			
		//return detailed data of the selected providers
		query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street, Provider_Full_City, Provider_Business_Practice_Location_Address_Telephone_Number FROM npidata2 WHERE ((NPI = '"+npi1+"')";
		if(npi2) query += "OR (NPI = '"+npi2+"')";
		if(npi3) query += "OR (NPI = '"+npi3+"')";
		query += ")";
		
		[rows,fields] = await db.query(query);
		
		return ServerReply (200, {"providers": rows, "Transaction": transactionid});
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	}
};