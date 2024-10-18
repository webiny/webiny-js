const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class BeforeBuildPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-before-build";
}

const createBeforeBuildPlugin = callable => {
    return new BeforeBuildPlugin(callable);
};

module.exports = { BeforeBuildPlugin, createBeforeBuildPlugin };
