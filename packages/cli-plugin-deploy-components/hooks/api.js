module.exports = {
    hooks: {
        afterDeploy({ isFirstdDeploy, env, state }) {
            console.log("API Template hooks!");
        }
    }
};