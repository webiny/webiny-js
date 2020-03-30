import React from "react";
import { createTemplate } from "@webiny/app-template";
import { ApolloProvider } from "react-apollo";

// App structure imports
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/Install/AppInstaller";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";

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
import { createApolloClient } from "./apolloClient";
import { NetworkError } from "./apolloClient/NetworkError";

// Router
import { BrowserRouter, Route, Redirect } from "@webiny/react-router";

export type AdminAppOptions = {
    apolloClient: {
        uri: string;
    };
    cognito: {
        region: string;
        userPoolId: string;
        userPoolWebClientId: string;
    };
    defaultRoute?: string;
    plugins?: any[];
};

export default createTemplate<AdminAppOptions>(opts => {
    const appStructure = [
        {
            type: "app-template-renderer",
            name: "app-template-renderer-apollo",
            render(children) {
                return (
                    <ApolloProvider client={createApolloClient(opts.apolloClient)}>
                        <NetworkError>{children}</NetworkError>
                    </ApolloProvider>
                );
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-router",
            render(children) {
                return (
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        {children}
                        <Route
                            exact
                            path="/"
                            render={() => <Redirect to={opts.defaultRoute || "/users"} />}
                        />
                    </BrowserRouter>
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
                return (
                    <I18NProvider loader={<CircularProgress label={"Loading locales..."} />}>
                        {children}
                    </I18NProvider>
                );
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-app-installer",
            render(children) {
                const securityProvider = (
                    <SecurityProvider loader={<CircularProgress label={"Checking user..."} />} />
                );

                return <AppInstaller security={securityProvider}>{children}</AppInstaller>;
            }
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-admin-theme",
            render(children) {
                return <ThemeProvider>{children}</ThemeProvider>;
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
