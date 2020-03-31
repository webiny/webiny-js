import React from "react";
import adminAppTemplate, { AdminAppOptions } from "@webiny/app-template-admin";

// App structure imports
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";

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

export default (options: AdminAppOptions) => {
    const plugins = [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-page-builder",
            render(children) {
                return <PageBuilderProvider isEditor>{children}</PageBuilderProvider>;
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
        mailchimpPlugins
    ];

    return adminAppTemplate({ ...options, plugins });
};
