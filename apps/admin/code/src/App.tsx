import React, { useCallback } from "react";
import { ApolloProvider } from "react-apollo";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { Routes } from "@webiny/app/components/Routes";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { SecurityProvider } from "@webiny/app-security";
import { CircularProgress } from "@webiny/ui/Progress";
import { AppInstaller } from "@webiny/app-admin/components/AppInstaller";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { BrowserRouter } from "@webiny/react-router";
import { Authentication } from "@webiny/app-plugin-security-cognito/Authentication";
import { createApolloClient } from "./components/apolloClient";
import { NetworkError } from "./components/NetworkError";
import { getIdentityData } from "./components/getIdentityData";

// Import styles which include custom theme styles
import "./App.scss";
import { RichTextEditor } from "@webiny/ui/RichTextEditor";
import { FileManager } from "@webiny/app-admin/components";

export const App = () => {
    const onChange = useCallback(data => {
        console.log(data);
    }, []);

    return (
        <ApolloProvider client={createApolloClient()}>
            {/* 
            <SecurityProvider> is a generic provider of identity information. 3rd party identity providers (like Cognito,
            Okta, Auth0) will handle the authentication, and set the information about the user into this provider,
            so other parts of the system have a centralized place to fetch user information from. 
        */}
            <SecurityProvider>
                {/* 
                    <NetworkError> renders network error information when there are problems communicating with your GraphQL API. 
                */}
                <NetworkError>
                    {/* 
                        <BrowserRouter> is an enhanced version of "react-router" to add some capabilities specific to Webiny.
                    */}
                    <BrowserRouter basename={process.env.PUBLIC_URL}>
                        {/* 
                            <UiProvider> is a centralized state handler for UI related things. When you need to render
                            dialogs, snackbars, handle dark mode, you can use the "useUi()" hook to set/unset UI information
                            without losing the state on route transitions. 
                            NOTE: we do not recommend using this provider for you application data, it's just a helper state
                            manager to handle UI easier.    
                        */}
                        <UiProvider>
                            <FileManager>
                                {({ showFileManager }) => (
                                    <RichTextEditor
                                        value={null}
                                        onChange={onChange}
                                        showFileManager={showFileManager}
                                    />
                                )}
                            </FileManager>
                        </UiProvider>
                    </BrowserRouter>
                </NetworkError>
            </SecurityProvider>
        </ApolloProvider>
    );
};
