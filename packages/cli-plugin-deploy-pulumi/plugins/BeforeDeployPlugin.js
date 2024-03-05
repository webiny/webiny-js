const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class BeforeDeployPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-before-deploy";
}

module.exports = { BeforeDeployPlugin };
