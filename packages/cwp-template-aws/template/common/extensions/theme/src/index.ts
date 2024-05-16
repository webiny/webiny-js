import { PbPageLayoutPlugin } from "@webiny/app-page-builder";
import { FbFormLayoutPlugin } from "@webiny/app-form-builder";
import { ThemePlugin } from "@webiny/app-website";

// Global styles, applied to all themes.
import "./global.scss";

// The central theme object which defines different visual aspects of your website,
// for example the default set of colors, typography, breakpoints, and more.
import theme from "./theme";

// Default layouts used by Page Builder pages and Form Builder forms.
import StaticLayout from "./layouts/pages/Static";
import DefaultFormLayout from "./layouts/forms/DefaultFormLayout";

// Ultimately, theme and layouts need to be registered via their respective plugins.
// To learn more, see: https://www.webiny.com/docs/page-builder/theming/introduction.
export default () => [
    new ThemePlugin(theme),

    new PbPageLayoutPlugin({
        name: "static",
        title: "Static page",
        component: StaticLayout
    }),

    new FbFormLayoutPlugin({
        name: "default",
        title: "Default form layout",
        component: DefaultFormLayout
    })
];
