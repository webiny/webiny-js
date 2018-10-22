// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";

const EmptyLayout = ({ children }: { children: React.Node }) => {
    return <React.Fragment>{renderPlugins("empty-layout", { content: children })}</React.Fragment>;
};

export default EmptyLayout;
