const {
    PulumiCommandLifecycleEventHookPlugin
} = require("./PulumiCommandLifecycleEventHookPlugin");

class BeforeWatchPlugin extends PulumiCommandLifecycleEventHookPlugin {
    static type = "hook-before-watch";
}

const createBeforeWatchPlugin = callable => {
    return new BeforeWatchPlugin(callable);
};

module.exports = { BeforeWatchPlugin, createBeforeWatchPlugin };
