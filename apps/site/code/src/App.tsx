import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "@webiny/react-router";
import { UiProvider } from "@webiny/app/contexts/Ui";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { Routes } from "@webiny/app/components/Routes";

// ApolloClient
import { createApolloClient } from "./components/apolloClient";

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
