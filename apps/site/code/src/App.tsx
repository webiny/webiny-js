import React from "react";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Switch, Route } from "@webiny/react-router";

import PageRoute from "./components/Page/PageRoute";
import { createApolloClient } from "./components/apolloClient";

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <Switch>
                <Route path={"*"} component={PageRoute}/>
            </Switch>
        </BrowserRouter>
    </ApolloProvider>
);
