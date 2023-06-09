import React from "react";
import { PbPageLayoutPlugin as LegacyPbPageLayoutPlugin } from "@webiny/app-page-builder/plugins";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type FbFormLayoutPluginProps = LegacyPbPageLayoutPlugin["layout"];

export const FbFormLayoutPlugin = createLegacyPlugin<
    FbFormLayoutPluginProps,
    LegacyPbPageLayoutPlugin
>(props => new LegacyPbPageLayoutPlugin(props));
