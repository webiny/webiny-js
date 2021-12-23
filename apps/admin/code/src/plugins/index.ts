import { plugins } from "@webiny/plugins";
import { plugins as tenancyPlugins } from "@webiny/app-tenancy";
import welcomeScreenPlugins from "@webiny/app-plugin-admin-welcome-screen";
import routeNotFound from "./routeNotFound";
import basePlugins from "./base";
import apolloLinkPlugins from "./apolloLinks";
import adminPlugins from "./admin";
import i18nPlugins from "./i18n";
import i18nContentPlugins from "./i18nContent";
import securityPlugins from "./security";
import pageBuilderPlugins from "./pageBuilder";
import formBuilderPlugins from "./formBuilder";
import headlessCmsPlugins from "./headlessCms";
import theme from "theme";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./scaffolds";

plugins.register([
    /**
     * Base app plugins (files, images).
     */
    basePlugins,
    /**
     * ApolloClient link plugins.
     */
    apolloLinkPlugins,
    /**
     * Complete admin app UI.
     */
    adminPlugins,
    /**
     * Renders a welcome screen with useful links at "/".
     */
    welcomeScreenPlugins(),
    /**
     * Handles location paths that don't have a corresponding route.
     */
    routeNotFound,
    /**
     * Internationalization app.
     */
    i18nPlugins,
    /**
     * Enables storing content (pages, forms, content, ...) in multiple locales.
     */
    i18nContentPlugins,
    /**
     * Tenant installation.
     */
    tenancyPlugins(),
    /**
     * Security app and authentication plugins.
     */
    securityPlugins,
    /**
     * Page Builder app.
     */
    pageBuilderPlugins,
    /**
     * Form Builder app.
     */
    formBuilderPlugins,
    /**
     * Headless CMS app.
     */
    headlessCmsPlugins,
    /**
     * App theme controls page builder and form builder layouts, styles, etc.
     */
    theme(),
    /**
     * Plugins created via scaffolding utilities.
     */
    scaffoldsPlugins()
]);
