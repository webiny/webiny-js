import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { Routes } from "@webiny/app/components/Routes";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security";
import { TenancyProvider } from "@webiny/app-tenancy/contexts/Tenancy";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/AppInstaller";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { BrowserRouter } from "@webiny/react-router";
import { createAuthentication } from "@webiny/app-admin-users-cognito";
import { createApolloClient } from "./components/apolloClient";
import { Telemetry } from "./components/Telemetry";
import "./App.scss";

export const App = () => (
    <ApolloProvider client={createApolloClient({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
        {/*
            <TenancyProvider> provides tenant context and a mechanism to switch tenants in a multi-tenant environment.
        */}
        <TenancyProvider>
            {/* 
                <SecurityProvider> is a generic provider of identity information. 3rd party identity providers (like Cognito,
                Okta, Auth0) will handle the authentication, and set the information about the user into this provider,
                so other parts of the system have a centralized place to fetch user information from.
            */}
            <SecurityProvider>
                {/*
                    <BrowserRouter> is an enhanced version of "react-router" to add some capabilities specific to Webiny.
                */}
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    {/*
                        To learn more about Webiny telemetry system, please visit: https://docs.webiny.com/docs/webiny-telemetry
                    */}
                    <Telemetry />
                    {/*
                        <UiProvider> is a centralized state handler for UI related things. When you need to render
                        dialogs, snackbars, handle dark mode, you can use the "useUi()" hook to set/unset UI information
                        without losing the state on route transitions.
                        NOTE: we do not recommend using this provider for you application data, it's just a helper state
                        manager to handle UI easier.
                    */}
                    <UiProvider>
                        {/*
                            <AppInstaller> checks and runs app installers registered via "admin-installation" plugins.
                        */}
                        <AppInstaller Authentication={createAuthentication()}>
                            {/*
                                <I18NProvider> loads system locales. Webiny supports multi-language content and language-based
                                permissions, so we always need to know all locales to be able to render language selectors,
                                and send the proper locale code to the GraphQL API.
                            */}
                            <I18NProvider
                                loader={<CircularProgress label={"Loading locales..."} />}
                            >
                                {/*
                                    <PageBuilderProvider> handles "pb-theme" plugins and combines them into a single
                                    "theme" object. You can build your theme using multiple "pb-theme" plugins and
                                    then access is using "usePageBuilder()" hook.
                                */}
                                <PageBuilderProvider>
                                    {/*
                                        <CmsProvider> handles CMS environments and provides an Apollo Client instance
                                        that points to the /manage GraphQL API.
                                    */}
                                    <CmsProvider createApolloClient={createApolloClient}>
                                        {/*
                                            <Routes/> is a helper component that loads all "route" plugins, sorts them
                                            in the correct "path" order and renders using the <Switch> component, 
                                            so only the matching route is rendered.   
                                        */}
                                        <Routes />
                                    </CmsProvider>
                                </PageBuilderProvider>
                            </I18NProvider>
                        </AppInstaller>
                    </UiProvider>
                </BrowserRouter>
            </SecurityProvider>
        </TenancyProvider>
    </ApolloProvider>
);
