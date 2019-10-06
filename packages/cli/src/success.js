const { blue } = require("chalk");
console.log();
console.log("Your local Webiny project is ready!!");
console.log("Now it is time to deploy your API 🚀");
console.log(`\n1) Navigate to your ${blue("functions/prod")} folder and update the ENV variables in ${blue(".env")} file.`);
console.log(`   NOTE: if you don't already have a Mongo database up and running in the cloud, to get one as fast as possible, we suggest ${blue("Mongo Atlas")}.`);
console.log(`\n2) Next, run ${blue("sls")} to kick off the first deployment of your API.\n   It will take a minute or two to deploy, so be patient.`);
console.log(`\n3) Once your API is deployed, you will see a list of cloud resources that were created.\n   Take note of the ${blue("cdn.url")}, you'll need it for your apps.`);
