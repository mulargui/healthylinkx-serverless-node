const S3Create = require('./S3Create.ts');

usage(){
	console.log('Sorry, that is not something I know how to do.');
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
		console.log('11');
	    break;
	case 'update':
		console.log('12');
	    break;
	default:
		return usage();
	}
    break;
case 'api':
	switch (myArgs[1]) {
	case 'create':
		console.log('20');
		break;
	case 'delete':
		console.log('21');
	    break;
	case 'update':
		console.log('22');
	    break;
	default:
		return usage();
	}
    break;
case 'ux':
	switch (myArgs[1]) {
	case 'create':
		console.log('30');
		break;
	case 'delete':
		console.log('31');
	    break;
	case 'update':
		console.log('32');
	    break;
	default:
		return usage();
	}
    break;
case 'all':
	switch (myArgs[1]) {
	case 'create':
		console.log('40');
		break;
	case 'delete':
		console.log('41');
	    break;
	case 'update':
		console.log('42');
	    break;
	default:
		return usage();
	}
    break;
default:
    return usage();
}








console.log(process.argv);

//S3Create();
