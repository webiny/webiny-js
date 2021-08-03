import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { Routes } from "@webiny/app/components/Routes";
import { BrowserRouter } from "@webiny/react-router";
import { createApolloClient } from "./apolloClient";

// Global (or specific) SCSS styles can be defined here.
import "./App.scss";

// The beginning of our React application, where we mount a couple of useful providers.
export const App = () => (
    <ApolloProvider client={createApolloClient({ uri: process.env.REACT_APP_GRAPHQL_API_URL })}>
        {/*
            <BrowserRouter> is an enhanced version of "react-router" to add some capabilities specific to Webiny.
        */}
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <Routes />
        </BrowserRouter>
    </ApolloProvider>
);
