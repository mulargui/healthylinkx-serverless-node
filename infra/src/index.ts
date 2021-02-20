const UXCreate = require('./UXCreate.ts');
const UXDelete = require('./UXDelete.ts');
const UXUpdate = require('./UXUpdate.ts');
const DSCreate = require('./DSCreate.ts');
const DSDelete = require('./DSDelete.ts');
const APICreate = require('./APICreate.ts');

function usage(){
	console.log('Usage: healthylinkx-cli ds|api|ux|all delete|d|create|c|update|u');
}

//command line arguments analysis
var myArgs = process.argv.slice(2);

switch (myArgs[0]) {
case 'ds':
	switch (myArgs[1]) {
	case 'create':
	case 'c':
		DSCreate();
		break;
	case 'delete':
	case 'd':
		DSDelete();
	    break;
	case 'update':
	case 'u':
		console.log('Not Implemented');
		usage();
	    break;
	default:
		usage();
	}
    break;
case 'api':
	switch (myArgs[1]) {
	case 'create':
	case 'c':
		await APICreate();
		break;
	case 'delete':
	case 'd':
		console.log('21');
	    break;
	case 'update':
	case 'u':
		console.log('22');
	    break;
	default:
		usage();
	}
    break;
case 'ux':
	switch (myArgs[1]) {
	case 'create':
	case 'c':
		UXCreate();
		break;
	case 'delete':
	case 'd':
		UXDelete();
	    break;
	case 'update':
	case 'u':
		UXUpdate();
	    break;
	default:
		usage();
	}
    break;
case 'all':
	switch (myArgs[1]) {
	case 'create':
	case 'c':
		console.log('40');
		break;
	case 'delete':
	case 'd':
		console.log('41');
	    break;
	case 'update':
	case 'u':
		console.log('42');
	    break;
	default:
		usage();
	}
    break;
default:
    usage();
}

