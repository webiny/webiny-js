import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "@webiny/react-router";
import { Routes } from "./components/Routes";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";

// ApolloClient
import { createApolloClient } from "./apolloClient";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <UiProvider>
                <I18NProvider>
                    <Routes />
                </I18NProvider>
            </UiProvider>
        </BrowserRouter>
    </ApolloProvider>
);
