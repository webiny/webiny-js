import React from "react";
import { createTemplate } from "@webiny/app-template";
import { ApolloProvider } from "react-apollo";

// App structure imports
import { UiProvider } from "@webiny/app/contexts/Ui";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";

// Other plugins
import { fileUploadPlugin, imagePlugin } from "@webiny/app/plugins";
import adminPlugins from "@webiny/app-admin/plugins";

// ApolloClient
import { createApolloClient } from "./apolloClient";
import { NetworkError } from "./apolloClient/NetworkError";

// Router
import { BrowserRouter, Route, Redirect } from "@webiny/react-router";

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
                return (
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        {children}
                        <Route
                            exact
                            path="/"
                            render={() => <Redirect to={opts.defaultRoute || "/account"} />}
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
            name: "app-template-renderer-admin-theme",
            render(children) {
                return <ThemeProvider>{children}</ThemeProvider>;
            }
        }
    ];

    const otherPlugins = [
        fileUploadPlugin(),
        imagePlugin(),
        adminPlugins(),
        ...(opts.plugins || [])
    ];

    return [...appStructure, ...otherPlugins];
});
