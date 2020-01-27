import pageBuilderPlugins from "@webiny/app-page-builder/site/plugins";
import pageBuilderTheme from "@webiny/app-page-builder-theme";
import pageBuilderUseSsrCacheTagsPlugins from "@webiny/app-page-builder/site/plugins/useSsrCacheTags";
import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/render";
import typeformPlugins from "@webiny/app-typeform/render";
import mailchimpPlugins from "@webiny/app-mailchimp/render";
import gtmPlugins from "@webiny/app-google-tag-manager/render";
import i18nPlugins from "@webiny/app-i18n/site/plugins";
import formsSitePlugins from "@webiny/app-form-builder/site/plugins";
import formsPbPlugins from "@webiny/app-form-builder/page-builder/site/plugins";
import formsTheme from "@webiny/app-form-builder-theme";

const plugins = [
    fileUploadPlugin(),
    imagePlugin,
    pageBuilderPlugins,
    pageBuilderUseSsrCacheTagsPlugins,
    pageBuilderTheme(),
    cookiePolicyPlugins,
    typeformPlugins,
    mailchimpPlugins,
    gtmPlugins,
    i18nPlugins,
    formsSitePlugins,
    formsPbPlugins,
    formsTheme()
];

export default plugins;
