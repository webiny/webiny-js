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
import { Authentication } from "@webiny/app-plugin-security-cognito/Authentication";
import { createApolloClient } from "./components/apolloClient";
import { NetworkError } from "./components/NetworkError";
import { getIdentityData } from "./components/getIdentityData";

// Import styles which include custom theme styles
import "./App.scss";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <SecurityProvider>
            <NetworkError>
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    <UiProvider>
                        {/* 
                            <I18NProvider> loads system locales. Webiny supports multi-language content and language-based 
                            permissions, so we always need to know all locales to be able to render language selectors, 
                            and send the proper locale code to the GraphQL API. 
                        */}
                        <I18NProvider loader={<CircularProgress label={"Loading locales..."} />}>
                            {/* 
                                <AppInstaller> checks and runs app installers registered via "admin-installation" plugins. 
                                Requires "app-installer-security" plugin configured in "./plugins/security.ts"
                                to render login for protected installers. 
                            */}
                            <AppInstaller>
                                {/*
                                    Once all installers are executed, <Authentication> is mounted to check the identity
                                    and prompt for login, if necessary. Once logged in, it sets the identity data into
                                    the <SecurityProvider>.
                                */}
                                <Authentication getIdentityData={getIdentityData}>
                                    <PageBuilderProvider>
                                        <CmsProvider>
                                            <ThemeProvider>
                                                <Routes />
                                            </ThemeProvider>
                                        </CmsProvider>
                                    </PageBuilderProvider>
                                </Authentication>
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
