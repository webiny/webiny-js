// @flow
import * as React from "react";
import { getPlugins } from "webiny-app/plugins";
import Plugin from "./Plugin";

const renderPlugins = (type: string, params?: Object, fn: string): Array<React.Node> => {
    return getPlugins(type).map(plugin => {
        return <Plugin key={plugin.name} name={plugin.name} params={params} fn={fn} />;
    });
};

type Props = {
    type: string,
    params?: Object,
    fn?: string
};

const Plugins = ({ type, params = {}, fn = "render" }: Props) => {
    return <React.Fragment>{renderPlugins(type, params, fn)}</React.Fragment>;
};

export default Plugins;
