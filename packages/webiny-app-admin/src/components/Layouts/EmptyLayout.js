// @flow
import * as React from "react";
import { getPlugins } from "webiny-app/plugins";

const renderPlugins = (type, params) => {
    return getPlugins(type).map(plugin => {
        return React.cloneElement(plugin.render(params), {
            key: plugin.name
        });
    });
};

const EmptyLayout = ({ children }: { children: React.Node }) => {
    return <React.Fragment>{renderPlugins("empty-layout", { content: children })}</React.Fragment>;
};

export default EmptyLayout;
