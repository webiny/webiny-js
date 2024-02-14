import React, { useMemo, createElement } from "react";
import { plugins } from "@webiny/plugins";
import { makeDecoratable } from "@webiny/app";
import { PbPageLayoutPlugin } from "@webiny/app-page-builder/types";
import { usePage } from "@webiny/app-page-builder-elements";

export interface LayoutProps {
    children: React.ReactNode;
}

export const Layout = makeDecoratable("Layout", ({ children }: LayoutProps) => {
    const layouts = useMemo(() => {
        const layoutPlugins = plugins.byType<PbPageLayoutPlugin>("pb-page-layout");
        return layoutPlugins.map(pl => pl.layout);
    }, []);

    const { page } = usePage();

    const layout = page?.settings?.general?.layout || null;
    if (!layout) {
        return children as React.ReactElement;
    }
    const themeLayout = layouts.find(l => l.name === layout);

    if (!themeLayout) {
        return children as React.ReactElement;
    }

    return createElement(themeLayout.component, {}, children);
});
