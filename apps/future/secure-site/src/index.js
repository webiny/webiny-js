import "core-js/stable";
import "regenerator-runtime/runtime";
import "cross-fetch/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { BrowserRouter } from "@webiny/react-router";
import App from "./App";
import apolloClient from "./config/apollo";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;

render(
    <ApolloProvider client={apolloClient}>
        <BrowserRouter basename={process.env.PUBLIC_URL === "/" ? "" : process.env.PUBLIC_URL}>
            <App />
        </BrowserRouter>
    </ApolloProvider>,
    document.getElementById("root")
);
