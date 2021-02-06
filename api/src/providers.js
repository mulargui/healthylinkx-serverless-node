const constants = require("./constants.js");
const mysql = require('mysql2/promise');
const axios = require('axios');

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
		return ServerReply (204, {"error": 'not params!'});

	var gender = event.queryStringParameters.gender;
	var lastname1 = event.queryStringParameters.lastname1;
	var lastname2 = event.queryStringParameters.lastname2;
	var lastname3 = event.queryStringParameters.lastname3;
	var specialty = event.queryStringParameters.specialty;
	var distance = event.queryStringParameters.distance;
	var zipcode = event.queryStringParameters.zipcode;
 	
 	//check params
 	if(!zipcode && !lastname1 && !specialty)
		return ServerReply (204, {"error": 'not enought params!'});
	
 	var query = "SELECT NPI,Provider_Full_Name,Provider_Full_Street,Provider_Full_City FROM npidata2 WHERE (";
 	if(lastname1)
 		query += "((Provider_Last_Name_Legal_Name = '" + lastname1 + "')";
 	if(lastname2)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname2 + "')";
 	if(lastname3)
 		query += " OR (Provider_Last_Name_Legal_Name = '" + lastname3 + "')";
 	if(lastname1)
 		query += ")";
 	if(gender)
 		if(lastname1)
 			query += " AND (Provider_Gender_Code = '" + gender + "')";
 		else
 			query += "(Provider_Gender_Code = '" + gender + "')";
 	if(specialty)
 		if(lastname1 || gender)
 			query += " AND (Classification = '" + specialty + "')";
 		else
 			query += "(Classification = '" + specialty + "')";

 	//case 1: no need to calculate zip codes at a distance
 	if (!distance || !zipcode){
 		if(zipcode)
 			if(lastname1 || gender || specialty)
 				query += " AND (Provider_Short_Postal_Code = '"+ zipcode + "')";
 			else
 				query += "(Provider_Short_Postal_Code = '" + zipcode + "')";
		query += ") limit 50";
 		
		try {
			const [rows,fields] = await db.query(query);
			return ServerReply (200, rows);
		} catch(err) {
			return ServerReply (500, {"error": query + '#' + err});
		}
	}
	
 	//case 2:we need to find zipcodes at a distance

 	//lets get a few zipcodes
 	var queryapi = "http://" + constants.zipcodeapi + "/rest/" + constants.zipcodetoken 
		+ "/radius.json/" + zipcode + "/" + distance + "/mile";
	var zipcodes="";

	try {
		const response = await axios.get(queryapi);
		zipcodes=response.data;
	} catch (err) {
		return ServerReply (500, {"error": queryapi + ':' + err});
	}

	//no data
  	if (!zipcodes) return ServerReply (204, {"error": "no zipcodes!"});

	var length=zipcodes.zip_codes.length;

	//complete the query
 	if(lastname1 || gender || specialty)
 		query += " AND ((Provider_Short_Postal_Code = '"+zipcodes.zip_codes[0].zip_code+"')";
 	else
 		query += "((Provider_Short_Postal_Code = '"+zipcodes.zip_codes[0].zip_code+"')";
	for (var i=1; i<length;i++){
 		query += " OR (Provider_Short_Postal_Code = '"+ zipcodes.zip_codes[i].zip_code +"')";
	}
  	query += ")) limit 50";

	try {
		const [rows,fields] = await db.query(query);
		return ServerReply (200, rows);
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	}
}; 