const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class BeforeBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-before-build";
}

module.exports = { BeforeBuildPlugin };
