const { Plugin } = require("@webiny/plugins");

class BeforeBuildPlugin extends Plugin {
    static type = "hook-before-build";

    constructor(callable) {
        super();
        this._callable = callable;
    }

    async hook(params, context) {
        if (typeof this._callable !== "function") {
            throw Error(
                [
                    `Missing callable in BeforeBuildPlugin! Either pass a callable`,
                    `to plugin constructor or extend the plugin and override the "hook" method.`
                ].join(" ")
            );
        }

        return this._callable(params, context);
    }
}

module.exports = { BeforeBuildPlugin };
