import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "@webiny/react-router";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/Install/AppInstaller";
import { ThemeProvider } from "@webiny/app-admin/contexts/Theme";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { createApolloClient } from "./apolloClient";
import { Routes } from "./components/Routes";
import { NetworkError } from "./components/NetworkError";

// Import styles which include custom theme styles
import "./App.scss";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <SecurityProvider>
            <NetworkError>
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    <UiProvider>
                        <I18NProvider loader={<CircularProgress label={"Loading locales..."} />}>
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
