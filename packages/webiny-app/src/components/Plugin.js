// @flow
import * as React from "react";
import invariant from "invariant";
import { getPlugin } from "webiny-app/plugins";
import type { PluginType } from "webiny-app/types";

type Props = {
    name?: string,
    plugin?: PluginType,
    params?: Object,
    fn?: string
};

const Plugin = ({ name, plugin, params = {}, fn = "render", ...rest }: Props) => {
    if (name) {
        const pl = getPlugin(name);
        invariant(pl, `No such plugin "${name}"`);
        plugin = pl;
    }

    invariant(
        plugin,
        `Plugin component requires either an existing plugin name or a plugin object. Please specify either a "name" or a "plugin" prop!`
    );

    const content = plugin[fn].call(null, params);
    if (content) {
        return <React.Fragment>{React.cloneElement(content, rest)}</React.Fragment>;
    }
    return null;
};

export default Plugin;
