import "core-js/stable";
import "regenerator-runtime/runtime";
import "cross-fetch/polyfill";
import React from "react";
import ReactDOM from "react-dom";
import { ApolloProvider } from "react-apollo";
import { StaticRouter } from "@webiny/react-router";
import apolloClient from "./config/apollo";

const render = module.hot ? ReactDOM.render : ReactDOM.hydrate;

const App = createSite();

render(
    <ApolloProvider client={apolloClient}>
        <StaticRouter basename={process.env.PUBLIC_URL === "/" ? "" : process.env.PUBLIC_URL}>
            <App />
        </StaticRouter>
    </ApolloProvider>,
    document.getElementById("root")
);
