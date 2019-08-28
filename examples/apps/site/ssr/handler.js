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
import { createOmitTypenameLink } from "@webiny/app/graphql";
import injectContent from "./injectContent";
import App from "../src/App";

const createClient = ({ headers }) => {
    return new ApolloClient({
        ssrMode: true,
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createHttpLink({
                uri: process.env.REACT_APP_API_ENDPOINT,
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

export const handler = async event => {
    const apolloClient = createClient(event);

    const app = (
        <ApolloProvider client={apolloClient}>
            <StaticRouter basename={process.env.PUBLIC_URL} location={event.path} context={{}}>
                <App />
            </StaticRouter>
        </ApolloProvider>
    );

    // Executes all graphql queries for the current state of application
    await getDataFromTree(app);
    const content = ReactDOMServer.renderToStaticMarkup(app);
    const state = apolloClient.extract();
    const helmet = Helmet.renderStatic();
    return injectContent(content, helmet, state);
};
