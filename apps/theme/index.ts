import StaticLayout from "./layouts/pages/Static";
import theme from "./theme";

// TODO CLEAN!
import { PbPageLayoutPlugin } from "@webiny/app-page-builder";
import { ThemePlugin } from "@webiny/app-website";
import DefaultFormLayout from "./layouts/forms/DefaultFormLayout";

export default () => [
    new ThemePlugin(theme),
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
