import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { BrowserRouter, Switch, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { ThemeLoader } from "@webiny/app-theme-manager";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

const themes = [
    {
        name: "default",
        load: () => import("theme").then(m => m.default)
    },
    {
        name: "theme-1",
        load: () => import("theme-1").then(m => m.default)
    }
];

export const App = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <ThemeLoader themes={themes}>
                <PageBuilderProvider>
                    <Switch>
                        <Route path={"*"} component={Page} />
                    </Switch>
                </PageBuilderProvider>
            </ThemeLoader>
        </BrowserRouter>
    </ApolloProvider>
);
