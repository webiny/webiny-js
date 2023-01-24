import React from "react";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/core";
import { BrowserRouter, Routes, Route } from "@webiny/react-router";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";
import { ThemeLoader } from "@webiny/app-theme-manager/components/ThemeLoader";
import { ThemeSource } from "@webiny/app-theme-manager/types";

interface Props {
    apolloClient?: ReturnType<typeof createApolloClient>;
    themes?: ThemeSource[];
}

export const Website: React.FC<Props> = props => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    let content = (
        <Routes>
            <Route path={"*"} component={Page} />
        </Routes>
    );

    if (props.themes) {
        content = <ThemeLoader themes={props.themes}>{content}</ThemeLoader>;
    }

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <BrowserRouter basename={process.env.PUBLIC_URL}>
                    <PageBuilderProvider>{content}</PageBuilderProvider>
                </BrowserRouter>
            </ApolloProvider>
        </CacheProvider>
    );
};
