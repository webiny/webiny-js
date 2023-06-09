import React from "react";
import { FbFormLayoutPlugin as LegacyFbFormLayoutPlugin } from "@webiny/app-form-builder/plugins";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type FbFormLayoutPluginProps = LegacyFbFormLayoutPlugin["layout"];

export const FbFormLayoutPlugin = createLegacyPlugin<
    FbFormLayoutPluginProps,
    LegacyFbFormLayoutPlugin
>(props => new LegacyFbFormLayoutPlugin(props));
