module.exports = {
    type: "hook-before-deploy",
    name: "cli-command-aws",
    async hook(params, context) {
        // check AWS credentials
        try {
            let awsCred; //to equal command to call aws sts get-caller-identity and receive object data
        } catch (err) {
            throw err; //replace with a statement on failure to find aws creds
        }
    }
};
