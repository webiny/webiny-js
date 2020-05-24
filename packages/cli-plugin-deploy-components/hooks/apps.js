module.exports = {
    hooks: {
        afterDeploy({ isFirstdDeploy, env, state }) {
            console.log("Apps Template hooks!");
        }
    }
};