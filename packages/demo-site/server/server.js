import "cross-fetch/polyfill";
import "url-search-params-polyfill";
import path from "path";
import express from "express";
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

const app = express();

const createClient = req => {
    return new ApolloClient({
        ssrMode: true,
        link: ApolloLink.from([
            createOmitTypenameLink(),
            createHttpLink({
                uri: process.env.REACT_APP_API_HOST + "/function/api",
                credentials: "same-origin",
                headers: {
                    cookie: req.header("Cookie")
                }
            })
        ]),
        cache: new InMemoryCache({
            addTypename: true,
            dataIdFromObject: obj => obj.id || null
        })
    });
};

app.use("/files", express.static(path.resolve(__dirname, "../build"), { index: false }));
app.use("/static", express.static(path.resolve(__dirname, "../build/static"), { index: false }));

app.use(async (req, res) => {
    if (req.url.includes(".")) {
        res.status(200);
        res.send(`NOT AN API`);
        res.end();
        return;
    }

    const client = createClient(req);

    const app = (
        <ApolloProvider client={client}>
            <StaticRouter location={req.url} context={{}}>
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
    res.status(200);
    res.send(`<!DOCTYPE html>${html}`);
    res.end();
});

const port = process.env.PORT || 8888;

app.listen(port, () => {
    console.log(`Server listening on ${port} port`);
});
