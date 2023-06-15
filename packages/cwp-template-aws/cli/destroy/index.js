module.exports = () => ({
    type: "cli-command-deployment-destroy-all",
    name: "cli-command-deployment-destroy-all",
    destroy: (...args) => require("./destroy")(...args)
});
