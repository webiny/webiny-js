// @flow
import * as React from "react";
import { renderPlugins } from "webiny-app/plugins";

export const EmptyLayout = ({ children }: { children: React.Node }) => {
    return <React.Fragment>{renderPlugins("empty-layout", { content: children })}</React.Fragment>;
};
