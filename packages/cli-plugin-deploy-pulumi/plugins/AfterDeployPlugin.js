const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class AfterDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-after-deploy";
}

const createAfterDeployPlugin = callable => {
    return new AfterDeployPlugin(callable);
};

module.exports = { AfterDeployPlugin, createAfterDeployPlugin };
