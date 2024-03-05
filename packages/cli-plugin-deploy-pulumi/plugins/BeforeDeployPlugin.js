const { Plugin } = require("@webiny/plugins");

class BeforeDeployPlugin extends Plugin {
    static type = "hook-before-deploy";

    constructor(callable) {
        super();
        this._callable = callable;
    }

    async hook(params, context) {
        if (typeof this._callable !== "function") {
            throw Error(
                [
                    `Missing callable in BeforeDeployPlugin! Either pass a callable`,
                    `to plugin constructor or extend the plugin and override the "hook" method.`
                ].join(" ")
            );
        }

        return this._callable(params, context);
    }
}

module.exports = { BeforeDeployPlugin };
