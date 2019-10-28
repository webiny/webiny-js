import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Route, Redirect } from "react-router-dom";
import App from "./App";
import { NetworkError, apolloClient } from "./config";

ReactDOM.render(
    <ApolloProvider client={apolloClient}>
        <NetworkError>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
                <App />
                <Route exact path="/" render={() => <Redirect to="/page-builder/pages" />} />
            </BrowserRouter>
        </NetworkError>
    </ApolloProvider>,
    document.getElementById("root")
);
