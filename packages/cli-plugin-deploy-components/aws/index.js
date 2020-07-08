//const execa = require('execa');
//const AWS_CREDENTIALS = execa("aws sts get-caller-identity"); \
const STS = require("aws-sdk/clients/sts");

module.exports = {
    type: "hook-before-deploy",
    name: "cli-command-aws",
    async hook() {
        // check AWS credentials
        const sts = new STS();
        const stsResults = await sts
            .getCallerIdentity({})
            .promise()
            .then((result, err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("PROMISE RESULT::::::");
                    console.log(result);
                }
            });
    }
};
