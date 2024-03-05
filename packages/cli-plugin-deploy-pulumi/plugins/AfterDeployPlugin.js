const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class AfterDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-after-deploy";
}

module.exports = { AfterDeployPlugin };
