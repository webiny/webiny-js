// @flow
import * as React from "react";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { getPlugins } from "@webiny/plugins";

const Layout = ({ layout, children }) => {
    const { theme } = usePageBuilder();

    const layouts = React.useMemo(() => getPlugins("pb-page-layout").map(pl => pl.layout), []);

    const themeLayout = layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children;
    }

    return React.createElement(themeLayout.component, null, children);
};

export default Layout;
