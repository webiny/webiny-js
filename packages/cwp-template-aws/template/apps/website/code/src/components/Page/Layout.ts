import { useMemo, createElement } from "react";
import { getPlugins } from "@webiny/plugins";
import { PbPageLayoutPlugin } from "@webiny/app-page-builder/types";

const Layout = ({ page, settings, children }) => {
    const layouts = useMemo(() => {
        const plugins = getPlugins<PbPageLayoutPlugin>("pb-page-layout");
        return plugins.map(pl => pl.layout);
    }, []);

    const themeLayout = layouts.find(l => l.name === page.settings.general.layout);

    if (!themeLayout) {
        return children;
    }

    return createElement(themeLayout.component, { page, settings }, children);
};

export default Layout;
