import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import adminPlugins from "@webiny/app-admin/plugins";
import i18nPlugins from "@webiny/app-i18n/admin/plugins";
import securityPlugins from "@webiny/app-security/admin/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";
import pageBuilderTheme from "@webiny/app-page-builder-theme";
// import formBuilderPlugins from "@webiny/app-form-builder/admin/plugins";
// import formBuilderPageBuilderPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";
// import formBuilderTheme from "@webiny/app-form-builder-theme";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/admin";
import googleTagManagerPlugins from "@webiny/app-google-tag-manager/admin";
import typeformPlugins from "@webiny/app-typeform/admin";
import mailchimpPlugins from "@webiny/app-mailchimp/admin";
import cognito from "@webiny/app-plugin-security-cognito";
import cognitoTheme from "@webiny/app-plugin-security-cognito-theme/admin";


const plugins = [
    fileUploadPlugin(),
    imagePlugin,
    adminPlugins,
    i18nPlugins,
    securityPlugins,
    pageBuilderPlugins,
    pageBuilderTheme,
    // formBuilderPlugins,
    // formBuilderPageBuilderPlugins,
    // formBuilderTheme(),
    cookiePolicyPlugins,
    googleTagManagerPlugins,
    typeformPlugins,
    mailchimpPlugins,
    cognito({
        region: process.env.REACT_APP_USER_POOL_REGION,
        userPoolId: process.env.REACT_APP_USER_POOL_ID,
        userPoolWebClientId: process.env.REACT_APP_USER_POOL_WEB_CLIENT_ID
    }),
    cognitoTheme()
];

export default plugins;
