import "cross-fetch/polyfill";
import "url-search-params-polyfill";
import React from "react";
import { ApolloProvider } from "react-apollo";
import { StaticRouter } from "react-router-dom";
import ReactDOMServer from "react-dom/server";
import Helmet from "react-helmet";
import { getDataFromTree } from "react-apollo";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import { createOmitTypenameLink } from "webiny-app/graphql";

import Html from "./Html";
import App from "../src/App";
import assets from "./assets";

const createClient = ({ headers }) => {
    return new ApolloClient({
        ssrMode: true,
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createHttpLink({
                uri: process.env.REACT_APP_API_HOST + "/function/api",
                credentials: "same-origin",
                headers
            })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

export async function handler(event) {
    const { path } = event;
    const client = createClient(event);

    const app = (
        <ApolloProvider client={client}>
            <StaticRouter location={path} context={{}}>
                <App />
            </StaticRouter>
        </ApolloProvider>
    );

    // Executes all graphql queries for the current state of application
    await getDataFromTree(app);
    const content = ReactDOMServer.renderToStaticMarkup(app);
    const state = client.extract();
    const helmet = Helmet.renderStatic();
    const html = ReactDOMServer.renderToStaticMarkup(
        <Html content={content} helmet={helmet} assets={assets} state={state} />
    );

    return `<!DOCTYPE html>${html}`;
}
