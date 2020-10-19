import React from "react";
import { ApolloProvider } from "react-apollo";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { Routes } from "@webiny/app/components/Routes";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/Install/AppInstaller";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { BrowserRouter } from "@webiny/react-router";
import { createApolloClient } from "./apolloClient";
import { NetworkError } from "./components/NetworkError";
import Authentication from "./components/Authentication";

// Import styles which include custom theme styles
import "./App.scss";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <SecurityProvider>
            <NetworkError>
                <Authentication>
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        <UiProvider>
                            <I18NProvider
                                loader={<CircularProgress label={"Loading locales..."} />}
                            >
                                <AppInstaller>
                                    <PageBuilderProvider>
                                        <CmsProvider>
                                            <ThemeProvider>
                                                <Routes />
                                            </ThemeProvider>
                                        </CmsProvider>
                                    </PageBuilderProvider>
                                </AppInstaller>
                            </I18NProvider>
                        </UiProvider>
                    </BrowserRouter>
                </Authentication>
            </NetworkError>
        </SecurityProvider>
    </ApolloProvider>
);

/**
 * TODO:
 * - introduce <WebinyProvider> to hold plugins and UI state
 * - remove UiProvider
 * - remove admin ThemeProvider
 * - move DarkTheme handling logic into a plugin that uses UI state
 */
