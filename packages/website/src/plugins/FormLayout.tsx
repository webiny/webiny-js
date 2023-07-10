import React from "react";
import { FbFormLayoutPlugin as LegacyFbFormLayoutPlugin } from "@webiny/app-form-builder/plugins";
import { createLegacyPlugin } from "~/plugins/createLegacyPlugin";

type FormLayoutProps = LegacyFbFormLayoutPlugin["layout"];

export const FormLayout = createLegacyPlugin<
    FormLayoutProps,
    LegacyFbFormLayoutPlugin
>(props => new LegacyFbFormLayoutPlugin(props));
