const UXCreate = require('./UXCreate.ts');
const UXDelete = require('./UXDelete.ts');

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
		console.log('10');
		break;
	case 'delete':
	case 'd':
		console.log('11');
	    break;
	case 'update':
	case 'u':
		console.log('12');
	    break;
	default:
		return usage();
	}
    break;
case 'api':
	switch (myArgs[1]) {
	case 'create':
	case 'c':
		console.log('20');
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
		return usage();
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
		Delete();
	    break;
	case 'update':
	case 'u':
		console.log('32');
	    break;
	default:
		return usage();
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
		return usage();
	}
    break;
default:
    return usage();
}

