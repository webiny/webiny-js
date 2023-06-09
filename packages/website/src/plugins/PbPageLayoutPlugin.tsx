import React from "react";
import { PbPageLayoutPlugin as LegacyPbPageLayoutPlugin } from "@webiny/app-page-builder/plugins";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type PbPageLayoutPluginProps = LegacyPbPageLayoutPlugin["layout"];

export const PbPageLayoutPlugin = createLegacyPlugin<
    PbPageLayoutPluginProps,
    LegacyPbPageLayoutPlugin
>(props => new LegacyPbPageLayoutPlugin(props));
