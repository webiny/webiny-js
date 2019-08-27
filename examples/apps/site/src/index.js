import "cross-fetch/polyfill";
import "url-search-params-polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import apolloClient from "./config/apollo";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;

render(
    <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={process.env.PUBLIC_URL}>
            <App />
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root")
);
