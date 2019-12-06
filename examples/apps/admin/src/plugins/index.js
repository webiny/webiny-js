// @flow
import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import adminPlugins from "@webiny/app-admin/plugins";
import i18nPlugins from "@webiny/app-i18n/admin/plugins";
import securityPlugins from "@webiny/app-security/admin/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";
import formBuilderPlugins from "@webiny/app-forms/admin/plugins";
import formBuilderPageBuilderPlugins from "@webiny/app-forms/page-builder/admin/plugins";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/admin";
import googleTagManagerPlugins from "@webiny/app-google-tag-manager/admin";
import typeformPlugins from "@webiny/app-typeform/admin";
import mailchimpPlugins from "@webiny/app-mailchimp/admin";

const plugins = [
    fileUploadPlugin({}),
    imagePlugin,
    adminPlugins,
    i18nPlugins,
    securityPlugins,
    pageBuilderPlugins,
    formBuilderPlugins,
    formBuilderPageBuilderPlugins,
    cookiePolicyPlugins,
    googleTagManagerPlugins,
    typeformPlugins,
    mailchimpPlugins
];

export default plugins;
