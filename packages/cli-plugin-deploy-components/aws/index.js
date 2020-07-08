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
                    console.err(`The following error occured: ${err}.`);
                    console.log(`Please to refer to the following link for setting up credentials:
                    Please to refer to the following link for setting up aws credentials:
                    https://docs.webiny.com/docs/guides/aws-credentials/
                    `);
                } else {
                    console.log("Your AWS data is set!");
                    console.log(result);
                }
            });
    }
};
