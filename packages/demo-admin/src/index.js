import "cross-fetch/polyfill";
import "url-search-params-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter, Route, Redirect } from "react-router-dom";
import App from "./App";
import apolloClient from "./config/apollo";

ReactDOM.render(
    <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={"/admin"}>
            <App />
            <Route exact path="/" render={() => <Redirect to="/cms/pages" />} />
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root")
);
