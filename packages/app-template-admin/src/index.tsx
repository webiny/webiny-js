import React from "react";
import { createTemplate } from "@webiny/app-template";
import { ApolloProvider } from "react-apollo";

// App structure imports
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security/contexts/Security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/Install/AppInstaller";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";

// Other plugins
import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import adminPlugins from "@webiny/app-admin/plugins";
import i18nPlugins from "@webiny/app-i18n/admin/plugins";
import securityPlugins from "@webiny/app-security/admin/plugins";
import pageBuilderPlugins from "@webiny/app-page-builder/admin/plugins";
import pageBuilderTheme from "@webiny/app-page-builder-theme";
import formBuilderPlugins from "@webiny/app-form-builder/admin/plugins";
import formBuilderPageBuilderPlugins from "@webiny/app-form-builder/page-builder/admin/plugins";
import formBuilderTheme from "@webiny/app-form-builder-theme";
import cookiePolicyPlugins from "@webiny/app-cookie-policy/admin";
import googleTagManagerPlugins from "@webiny/app-google-tag-manager/admin";
import typeformPlugins from "@webiny/app-typeform/admin";
import mailchimpPlugins from "@webiny/app-mailchimp/admin";
import cognito from "@webiny/app-plugin-security-cognito";
import cognitoTheme from "@webiny/app-plugin-security-cognito-theme/admin";

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
    defaultRoute: string;
};

export default createTemplate<AdminAppOptions>(opts => {
    const appStructure = [
        {
            type: "app-template-hoc",
            name: "app-template-hoc-apollo",
            hoc: Component => props => {
                return (
                    <ApolloProvider client={createApolloClient(opts.apolloClient)}>
                        <NetworkError>
                            <Component {...props} />
                        </NetworkError>
                    </ApolloProvider>
                );
            }
        },
        {
            type: "app-template-hoc",
            name: "app-template-hoc-router",
            hoc: Component => props => {
                return (
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        <Component {...props} />
                        <Route exact path="/" render={() => <Redirect to={opts.defaultRoute} />} />
                    </BrowserRouter>
                );
            }
        },
        {
            type: "app-template-hoc",
            name: "app-template-hoc-ui",
            hoc: Component => props => {
                return (
                    <UiProvider>
                        <Component {...props} />
                    </UiProvider>
                );
            }
        },
        {
            type: "app-template-hoc",
            name: "app-template-hoc-i18n",
            hoc: Component => props => {
                return (
                    <I18NProvider loader={<CircularProgress label={"Loading locales..."} />}>
                        <Component {...props} />
                    </I18NProvider>
                );
            }
        },
        {
            type: "app-template-hoc",
            name: "app-template-hoc-app-installer",
            hoc: Component => props => {
                const securityProvider = (
                    <SecurityProvider loader={<CircularProgress label={"Checking user..."} />} />
                );

                return (
                    <AppInstaller security={securityProvider}>
                        <Component {...props} />
                    </AppInstaller>
                );
            }
        },
        {
            type: "app-template-hoc",
            name: "app-template-hoc-page-builder",
            hoc: Component => props => {
                return (
                    <PageBuilderProvider isEditor>
                        <ThemeProvider>
                            <Component {...props} />
                        </ThemeProvider>
                    </PageBuilderProvider>
                );
            }
        }
    ];

    const otherPlugins = [
        fileUploadPlugin(),
        imagePlugin,
        adminPlugins,
        i18nPlugins,
        securityPlugins,
        pageBuilderPlugins,
        pageBuilderTheme(),
        formBuilderPlugins,
        formBuilderPageBuilderPlugins,
        formBuilderTheme(),
        cookiePolicyPlugins,
        googleTagManagerPlugins,
        typeformPlugins,
        mailchimpPlugins,
        cognito(opts.cognito),
        cognitoTheme()
    ];

    return [...appStructure, ...otherPlugins];
});
