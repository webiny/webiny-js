import React from "react";
import { PbPageLayoutPlugin as LegacyPbPageLayoutPlugin } from "@webiny/app-page-builder/plugins";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type PageLayoutProps = LegacyPbPageLayoutPlugin["layout"];

export const PageLayout = createLegacyPlugin<
    PageLayoutProps,
    LegacyPbPageLayoutPlugin
>(props => new LegacyPbPageLayoutPlugin(props));
