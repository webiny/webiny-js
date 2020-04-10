import "cross-fetch/polyfill";
import "core-js/stable";
import "regenerator-runtime/runtime";
import React, { Fragment } from "react";
import { ApolloProvider } from "react-apollo";
import { StaticRouter } from "@webiny/react-router";
import { renderToStaticMarkup } from "react-dom/server";
import Helmet from "react-helmet";
import { getDataFromTree } from "@apollo/react-ssr";
import ApolloClient from "apollo-client";
import { ApolloLink } from "apollo-link";
import { InMemoryCache } from "apollo-cache-inmemory";
import { createHttpLink } from "apollo-link-http";
import { createOmitTypenameLink } from "@webiny/app/graphql";
import { App } from "../../site/src/App";

// Use `raw-loader` to copy the value of index.html into the SSR bundle.
// This way the bundle contains all it's dependencies and can be used entirely on its own.
import indexHtml from "!!raw-loader!../../site/build/index.html";

const createClient = () => {
    return new ApolloClient({
        ssrMode: true,
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createHttpLink({
                uri: process.env.REACT_APP_GRAPHQL_API_URL
            })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

const injectContent = (content, helmet, state) => {
    const replace = `
        <div id="root">${content}</div>
        <script>
            window.__APOLLO_STATE__=${JSON.stringify(state).replace(/</g, "\\\u003c")}
        </script>
    `;

    const meta = renderToStaticMarkup(
        <Fragment>
            {helmet.meta.toComponent()}
            {helmet.title.toComponent()}
        </Fragment>
    );

    return indexHtml
        .replace(`<div id="root"></div>`, replace)
        .replace(/<title.*?<\/title>/, "")
        .replace(`</head>`, meta + "</head>");
};

export const renderer = async url => {
    const apolloClient = createClient();
    const context = {};

    const app = (
        <ApolloProvider client={apolloClient}>
            <StaticRouter
                basename={process.env.PUBLIC_URL === "/" ? "" : process.env.PUBLIC_URL}
                location={url}
                context={context}
            >
                <App />
            </StaticRouter>
        </ApolloProvider>
    );

    // Executes all graphql queries for the current state of application
    await getDataFromTree(app);
    const content = renderToStaticMarkup(app);
    const state = apolloClient.extract();
    const helmet = Helmet.renderStatic();
    return { html: injectContent(content, helmet, state), state };
};
