const { Plugin } = require("@webiny/plugins");

class PulumiCommandLifecycleEventHookPlugin extends Plugin {
    constructor(callable) {
        super();
        this._callable = callable;
    }

    async hook(params, context) {
        if (typeof this._callable !== "function") {
            throw Error(
                [
                    `Missing callable in PulumiCommandLifecycleEventHookPlugin! Either pass a callable`,
                    `to plugin constructor or extend the plugin and override the "hook" method.`
                ].join(" ")
            );
        }

        return this._callable(params, context);
    }
}

module.exports = { PulumiCommandLifecycleEventHookPlugin };
