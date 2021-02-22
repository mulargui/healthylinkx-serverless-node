# healthylinkx-serverless-node
Healthylinkx is a 3 tiers app: ux, api and datastore. Implementation of Healthylinkx using AWS serverless resources (S3, API Gateway, Lambda, RDS MySQL, CloudShell)

Based on https://github.com/mulargui/healthylinkx-serverless  
In this repo we are replacing the shellscripts by a Node.js app (healthylinkx-cli). Also using TypeScript instead of vanilla JavaScript.  

Related repos (look at the documentation in each of them)  
UX https://github.com/mulargui/healthylinkx-ux  
API https://github.com/mulargui/healthylinkx-api-in-node  
Datastore https://github.com/mulargui/healthylinkx-mysql

This app installs in your default VPC. I need to add a little bit more code to healthylinkx-cli 
to create a dedicated VPC.

Directories and files  
/infra/src - healthylinkx-cli app to install, uninstall and update the whole app  
/infra/src/envparams-template.js - All the parameters of the app, like AWS secrets...
Fill your data and save it as envparams.js

The API is implemented as a set of lambdas exposed by an API Gateway  
/api/src - source code of the lambdas (node js) - one file per lambda  

The datastore is a RDS MySql instance  
/datastore/src - dump of the healthylinkx database (schema and data)

The ux is a web app (html+jquery+bootstrap+javascript) hosted in a S3 bucket  
/ux/src - the source code of the ux app 