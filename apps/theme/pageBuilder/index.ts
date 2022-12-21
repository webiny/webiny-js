import StaticLayout from "./layouts/Static";
import theme from "./theme";

import { PbThemePlugin, PbPageLayoutPlugin } from "@webiny/app-page-builder";

export default [
    new PbThemePlugin(theme),
    new PbPageLayoutPlugin({
        name: "static",
        title: "Static page",
        component: StaticLayout
    })
];
