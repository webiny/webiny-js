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
import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import adminPlugins from "@webiny/app-admin/plugins";
import welcomeScreenPlugins from "@webiny/app-plugin-admin-welcome-screen";
import i18nPlugins from "@webiny/app-i18n/admin/plugins";
import securityPlugins from "@webiny/app-security/admin/plugins";
import cognito from "@webiny/app-plugin-security-cognito";
import cognitoTheme from "@webiny/app-plugin-security-cognito-theme/admin";
import fileManagerPlugins from "@webiny/app-file-manager/admin";

// Webiny telemetry
import { Telemetry } from "./telemetry/Telemetry";

// ApolloClient
import { createApolloClient } from "./apolloClient";
import { NetworkError } from "./apolloClient/NetworkError";

// Router
import { BrowserRouter, Route, Redirect } from "@webiny/react-router";
import { RoutePlugin } from "@webiny/app/types";

export type AdminAppOptions = {
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
                    <ApolloProvider client={createApolloClient()}>
                        <NetworkError>{children}</NetworkError>
                    </ApolloProvider>
                );
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
        },
        {
            type: "app-template-renderer",
            name: "app-template-renderer-telemetry",
            render(children) {
                return <Telemetry>{children}</Telemetry>;
            }
        }
    ];

    const routes: RoutePlugin[] = [
        {
            type: "route",
            name: "route-not-found",
            route: <Route path="*" render={() => <Redirect to={opts.defaultRoute || "/"} />} />
        }
    ];

    const otherPlugins = [
        ...routes,
        welcomeScreenPlugins(),
        fileUploadPlugin(),
        imagePlugin(),
        adminPlugins(),
        i18nPlugins(),
        securityPlugins(),
        cognito(opts.cognito),
        cognitoTheme(),
        fileManagerPlugins(),
        ...(opts.plugins || [])
    ];

    return [...appStructure, ...otherPlugins];
});
