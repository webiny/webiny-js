import * as React from "react";
import { getPlugins } from "@webiny/plugins";
import { PbPageLayoutPlugin } from "@webiny/app-page-builder/types";

const Layout = ({ layout, children }) => {
    const layouts = React.useMemo(() => {
        const plugins = getPlugins("pb-page-layout") as PbPageLayoutPlugin[];
        return plugins.map(pl => pl.layout);
    }, []);

    const themeLayout = layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children;
    }

    return React.createElement(themeLayout.component, null, children);
};

export default Layout;
