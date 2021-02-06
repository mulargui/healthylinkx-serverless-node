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
	var query = "SELECT * FROM taxonomy";
	try {
		const [rows,fields] = await db.query(query);
		return ServerReply (200, rows);
	} catch(err) {
		return ServerReply (500, {"error": query + '#' + err});
	}
};

