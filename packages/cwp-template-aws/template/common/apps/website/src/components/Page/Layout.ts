import React, { useMemo, createElement } from "react";
import { plugins } from "@webiny/plugins";
import { PbPageLayoutPlugin, PbPageData } from "@webiny/app-page-builder/types";
import { SettingsQueryResponseData } from "./graphql";
import lodashGet from "lodash/get";

interface LayoutProps {
    page: PbPageData;
    settings: SettingsQueryResponseData;
}
const Layout: React.FC<LayoutProps> = ({ page, settings, children }) => {
    const layouts = useMemo(() => {
        const layoutPlugins = plugins.byType<PbPageLayoutPlugin>("pb-page-layout");
        return layoutPlugins.map(pl => pl.layout);
    }, []);

    const layout = lodashGet(page, "settings.general.layout", null);
    if (!layout) {
        return children as unknown as React.ReactElement;
    }
    const themeLayout = layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children as unknown as React.ReactElement;
    }

    return createElement(themeLayout.component, { page, settings }, children);
};

export default Layout;
