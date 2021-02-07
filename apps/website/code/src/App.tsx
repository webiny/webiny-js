import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { BrowserRouter, Switch, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <PageBuilderProvider>
                <Switch>
                    <Route path={"*"} component={Page} />
                </Switch>
            </PageBuilderProvider>
        </BrowserRouter>
    </ApolloProvider>
);
