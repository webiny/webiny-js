import { plugins } from "@webiny/plugins";
import { WebinyInitPlugin } from "@webiny/app/types";
import routeNotFound from "./routeNotFound";
import basePlugins from "./base";
import i18nPlugins from "./i18n";
import securityPlugins from "./security";
import pageBuilderPlugins from "./pageBuilder";
import formBuilderPlugins from "./formBuilder";
import headlessCmsPlugins from "./headlessCms";
import theme from "theme";

plugins.register([
    basePlugins,
    routeNotFound,
    i18nPlugins,
    securityPlugins,
    pageBuilderPlugins,
    formBuilderPlugins,
    headlessCmsPlugins,
    theme()
]);

plugins.byType<WebinyInitPlugin>("webiny-init").forEach((plugin) => plugin.init());
