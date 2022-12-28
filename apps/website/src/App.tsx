import React from "react";
import { ApolloProvider } from "@apollo/react-components";
import { BrowserRouter, Routes, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { createApolloClient } from "./components/apolloClient";
import Page from "./components/Page";

import { CacheProvider } from "@emotion/core";
import createCache from "@emotion/cache";

// As stated in https://emotion.sh/docs/ssr#puppeteer:
// "If you are using Puppeteer to prerender your application, emotion's
// speedy option has to be disabled so that the CSS is rendered into the DOM."
const emotionCache = createCache({
    key: "wby",
    speedy: false
});

export const App: React.FC = () => (
    <CacheProvider value={emotionCache}>
        <ApolloProvider client={createApolloClient()}>
            <BrowserRouter basename={process.env.PUBLIC_URL}>
                <PageBuilderProvider>
                    <Routes>
                        <Route path={"*"} component={Page} />
                    </Routes>
                </PageBuilderProvider>
            </BrowserRouter>
        </ApolloProvider>
    </CacheProvider>
);
