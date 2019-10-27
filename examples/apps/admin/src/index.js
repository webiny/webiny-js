import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Route, Redirect } from "react-router-dom";
import App from "./App";
import apolloClient, { NetworkMonitor } from "./config/apollo";

ReactDOM.render(
    <ApolloProvider client={apolloClient}>
        <NetworkMonitor>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
                <App />
                <Route exact path="/" render={() => <Redirect to="/page-builder/pages" />} />
            </BrowserRouter>
        </NetworkMonitor>
    </ApolloProvider>,
    document.getElementById("root")
);
