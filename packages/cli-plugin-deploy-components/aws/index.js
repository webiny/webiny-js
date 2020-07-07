//const execa = require('execa');
//const AWS_CREDENTIALS = execa("aws sts get-caller-identity"); \
const sts = require("aws-sdk/clients/sts");

module.exports = {
    type: "hook-before-deploy",
    name: "cli-command-aws",
    async hook(params, context) {
        // check AWS credentials
        console.log("sts:::::::::::::::");
        console.log(sts);
        try {
            //to equal command to call aws sts get-caller-identity and receive object data
            await sts.getCallerIdentity(params, function(err, data) {
                if (err) {
                    console.log("ERROR::::::::::::::::::");
                    console.log(err, err.stack); //an error occurred
                } else {
                    console.log("DATA::::::::::::::::::::");
                    console.log(data); //successful response
                }
            });
        } catch (err) {
            throw err; //replace with a statement on failure to find aws creds
        }
    }
};
