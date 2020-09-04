import React from "react";
import { createTemplate } from "@webiny/app-template";
import { AppTemplateRendererPlugin } from "@webiny/app-template/types";
import { BrowserRouter } from "@webiny/react-router";
import { ApolloProvider } from "@apollo/client";

// App structure imports
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";

// Other plugins
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
import formBuilderTheme from "@webiny/app-form-builder-theme";

// ApolloClient
import { createApolloClient } from "./apollo";

export type SiteAppOptions = {
    defaultRoute?: string;
    plugins?: any[];
};

export default createTemplate<SiteAppOptions>(opts => {
    const apolloClient = createApolloClient();

    const appStructure: AppTemplateRendererPlugin[] = [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-apollo",
            render(children) {
                return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-router",
            render(children) {
                return <BrowserRouter basename={process.env.PUBLIC_URL}>{children}</BrowserRouter>;
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-ui",
            render(children) {
                return <UiProvider>{children}</UiProvider>;
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-i18n",
            render(children) {
                return <I18NProvider>{children}</I18NProvider>;
            }
        }
    ];

    const otherPlugins = [
        fileUploadPlugin(),
        imagePlugin(),
        pageBuilderPlugins(),
        pageBuilderUseSsrCacheTagsPlugins(),
        pageBuilderTheme(),
        cookiePolicyPlugins(),
        typeformPlugins(),
        mailchimpPlugins(),
        gtmPlugins(),
        i18nPlugins(),
        formsSitePlugins(),
        formsPbPlugins(),
        formBuilderTheme()
    ];

    return [...appStructure, ...otherPlugins, ...(opts.plugins || [])];
});
