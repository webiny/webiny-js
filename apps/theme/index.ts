import StaticLayout from "./layouts/pages/Static";
import theme from "./theme";

import { PbThemePlugin, PbPageLayoutPlugin } from "@webiny/app-page-builder";
import DefaultFormLayout from "./layouts/forms/DefaultFormLayout";

export default () => [
    new PbThemePlugin(theme),
    new PbPageLayoutPlugin({
        name: "static",
        title: "Static page",
        component: StaticLayout
    }),
    {
        name: "form-layout-default",
        type: "form-layout",
        layout: {
            name: "default",
            title: "Default layout",
            component: DefaultFormLayout
        }
    }
];
