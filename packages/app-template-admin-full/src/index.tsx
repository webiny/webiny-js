import React from "react";
import adminAppTemplate, { AdminAppOptions } from "@webiny/app-template-admin";

// App structure imports
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";

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

export default (options: AdminAppOptions) => {
    const plugins = [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-page-builder",
            render(children) {
                return <PageBuilderProvider isEditor>{children}</PageBuilderProvider>;
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-headless-cms",
            render(children) {
                return <CmsProvider>{children}</CmsProvider>;
            }
        },
        pageBuilderPlugins,
        pageBuilderTheme(),
        formBuilderPlugins,
        formBuilderPageBuilderPlugins,
        formBuilderTheme(),
        cookiePolicyPlugins,
        googleTagManagerPlugins,
        typeformPlugins,
        mailchimpPlugins,
        headlessCmsPlugins
    ];

    return adminAppTemplate({ ...options, plugins });
};
