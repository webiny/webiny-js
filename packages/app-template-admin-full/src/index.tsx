import React from "react";
import adminAppTemplate, { AdminAppOptions } from "@webiny/app-template-admin";

// Other plugins
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";
import pageBuilderTheme from "@webiny/app-page-builder-theme";
import formBuilderPlugins from "@webiny/app-form-builder/admin/plugins";
import formBuilderPageBuilderPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";
import formBuilderTheme from "@webiny/app-form-builder-theme";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/admin";
import googleTagManagerPlugins from "@webiny/app-google-tag-manager/admin";
import typeformPlugins from "@webiny/app-typeform/admin";
import mailchimpPlugins from "@webiny/app-mailchimp/admin";
import headlessCmsPlugins from "@webiny/app-headless-cms/admin/plugins";
import fileManagerPlugins from "@webiny/app-file-manager/admin";

export default (options: AdminAppOptions) => {
    const plugins = [
        ...(options.plugins || []),
        pageBuilderPlugins(),
        pageBuilderTheme(),
        formBuilderPlugins(),
        formBuilderPageBuilderPlugins(),
        formBuilderTheme(),
        cookiePolicyPlugins(),
        googleTagManagerPlugins(),
        typeformPlugins(),
        mailchimpPlugins(),
        headlessCmsPlugins(),
        fileManagerPlugins()
    ];

    return adminAppTemplate({ ...options, plugins });
};
