import React from "react";
import { AddRoute, App, createProviderPlugin, Plugins } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/core";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";

interface Props {
    apolloClient?: ReturnType<typeof createApolloClient>;
}

const PageBuilderProviderPlugin = createProviderPlugin(PreviousProvider => {
    return function PageBuilderProviderHOC({ children }) {
        return (
            <PageBuilderProvider>
                <PreviousProvider>{children}</PreviousProvider>
            </PageBuilderProvider>
        );
    };
});

export const Website: React.FC<Props> = ({ children, ...props }) => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    // In development, debounce render by 1ms, to avoid router warnings about missing routes.
    const debounceMs = Number(process.env.NODE_ENV !== "production");

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <App debounceRender={debounceMs}>
                    <Plugins>
                        <AddRoute path={"*"} element={<Page />} />
                    </Plugins>
                    {children}
                    <PageBuilderProviderPlugin />
                </App>
            </ApolloProvider>
        </CacheProvider>
    );
};
