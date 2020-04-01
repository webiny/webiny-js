import React from "react";
import { createTemplate } from "@webiny/app-template";
import { BrowserRouter, Route, Redirect, StaticRouter } from "@webiny/react-router";
import ApolloClient from "apollo-client";
import { ApolloProvider } from "react-apollo";

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
import { AppTemplateRendererPlugin } from "../../app-template/src/types";

export type SiteAppOptions = {
    apolloClient: ApolloClient<any>;
    defaultRoute?: string;
    plugins?: any[];
    url?: string; // Only used in SSR mode
};

export default createTemplate<SiteAppOptions>(opts => {
    const isSSR = process.env.REACT_APP_ENV === "ssr";

    const apolloClient = opts.apolloClient || createApolloClient();

    const appStructure: AppTemplateRendererPlugin[] = [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-apollo",
            render(children) {
                return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
            }
        },
        !isSSR && {
            type: "app-template-renderer",
            name: "app-template-renderer-router",
            render(children) {
                return (
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        {children}
                        <Route
                            exact
                            path="/"
                            render={() => <Redirect to={opts.defaultRoute || "/"} />}
                        />
                    </BrowserRouter>
                );
            }
        },
        isSSR && {
            type: "app-template-renderer",
            name: "app-template-renderer-router",
            render(children) {
                return (
                    <StaticRouter
                        basename={process.env.PUBLIC_URL === "/" ? "" : process.env.PUBLIC_URL}
                        location={opts.url}
                        context={{}}
                    >
                        {children}
                    </StaticRouter>
                );
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
        formBuilderTheme(),
        ...(opts.plugins || [])
    ];

    return [...appStructure, ...otherPlugins];
});
