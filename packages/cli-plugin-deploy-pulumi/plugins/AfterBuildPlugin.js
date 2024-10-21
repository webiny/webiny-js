const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class AfterBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-after-build";
}

const createAfterBuildPlugin = callable => {
    return new AfterBuildPlugin(callable);
};

module.exports = { AfterBuildPlugin, createAfterBuildPlugin };
