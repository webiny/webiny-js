import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { BrowserRouter, Routes, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

export const App: React.FC = () => (
    <ApolloProvider client={createApolloClient()}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <PageBuilderProvider>
                <Routes>
                    <Route path={"*"} element={<Page />} />
                </Routes>
            </PageBuilderProvider>
        </BrowserRouter>
    </ApolloProvider>
);
