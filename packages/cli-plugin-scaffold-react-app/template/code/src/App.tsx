import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { Routes } from "@webiny/app/components/Routes";
import { BrowserRouter } from "@webiny/react-router";
import { createApolloClient } from "./components/apolloClient";
import { Telemetry } from "./components/Telemetry";

// Import styles which include custom theme styles
import "./App.scss";

export const App = () => (
    <ApolloProvider client={createApolloClient({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
        {/*
            <BrowserRouter> is an enhanced version of "react-router" to add some capabilities specific to Webiny.
        */}
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            {/*
                To learn more about Webiny telemetry system, please visit: https://docs.webiny.com/docs/webiny-telemetry
            */}
            <Telemetry />
            <Routes />
        </BrowserRouter>
    </ApolloProvider>
);
