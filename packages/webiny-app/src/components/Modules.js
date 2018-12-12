// @flow
import React from "react";
import { getPlugins } from "webiny-plugins";

type Props = {};
type State = {
    ready: boolean
};

export default class Modules extends React.Component<Props, State> {
    settings = {};
    state = {
        ready: false
    };

    constructor() {
        super();
        this.init().then(() => {
            this.setState({ ready: true });
        });
    }

    async init() {
        const plugins = getPlugins("module-render");
        for (let i = 0; i < plugins.length; i++) {
            let plugin = plugins[i];
            this.settings[plugin.name] = {};
            if (plugin.settings) {
                if (typeof plugin.settings === "function") {
                    this.settings[plugin.name] = await plugin.settings();
                } else {
                    this.settings[plugin.name] = plugin.settings;
                }
            }
        }
    }

    render() {
        const { ready } = this.state;
        if (ready) {
            return getPlugins("module-render").map(plugin => {
                return React.cloneElement(plugin.component, {
                    key: plugin.name,
                    settings: this.settings[plugin.name]
                });
            });
        }

        return null;
    }
}
