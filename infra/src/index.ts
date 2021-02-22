const UXCreate = require('./UXCreate.ts');
const UXDelete = require('./UXDelete.ts');
const UXUpdate = require('./UXUpdate.ts');
const DSCreate = require('./DSCreate.ts');
const DSDelete = require('./DSDelete.ts');
const APICreate = require('./APICreate.ts');
const APIDelete = require('./APIDelete.ts');
const APIUpdate = require('./APIUpdate.ts');

function usage(){
	console.log('Usage: healthylinkx-cli ds|api|ux|all delete|d|create|c|update|u');
}

async function main () {
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
			APICreate();
			break;
		case 'delete':
		case 'd':
			APIDelete();
			break;
		case 'update':
		case 'u':
			APIUpdate();
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
			await DSCreate();
			await APICreate();
			await UXCreate();
			break;
		case 'delete':
		case 'd':
			await UXDelete();
			await APIDelete();
			await DSDelete();
			break;
		case 'update':
		case 'u':
			await APIUpdate();
			await UXUpdate();
			break;
		default:
			usage();
		}
		break;
	default:
		usage();
	}
	return 1;
}

main();
