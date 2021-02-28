module.exports = () => ({
    type: "cli-command-deployment-deploy-all",
    name: "cli-command-deployment-deploy-all",
    deploy: (...args) => require("./deploy")(...args)
});
