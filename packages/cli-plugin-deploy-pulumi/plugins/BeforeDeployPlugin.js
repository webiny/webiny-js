const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class BeforeDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-before-deploy";
}

const createBeforeDeployPlugin = callable => {
    return new BeforeDeployPlugin(callable);
};

module.exports = { BeforeDeployPlugin, createBeforeDeployPlugin };
