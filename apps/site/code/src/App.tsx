import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Switch, Route } from "@webiny/react-router";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <Switch>
                <Route path={"*"} component={Page}/>
            </Switch>
        </BrowserRouter>
    </ApolloProvider>
);
