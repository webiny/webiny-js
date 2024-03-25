const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class AfterBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-after-build";
}

module.exports = { AfterBuildPlugin };
