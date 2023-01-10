import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/core";
import { BrowserRouter, Routes, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";

interface Props {
    apolloClient?: ReturnType<typeof createApolloClient>;
}

export const Website: React.FC<Props> = props => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
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
};
