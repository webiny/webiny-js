import React from "react";
import { App, AppProps, HigherOrderComponent } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/react";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";
import { ThemeProvider } from "@webiny/app-theme";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";

export interface WebsiteProps extends AppProps {
    apolloClient?: ReturnType<typeof createApolloClient>;
}

const PageBuilderProviderHOC: HigherOrderComponent = PreviousProvider => {
    return function PageBuilderProviderHOC({ children }) {
        return (
            <PageBuilderProvider>
                <PreviousProvider>{children}</PreviousProvider>
            </PageBuilderProvider>
        );
    };
};

export const Website = ({ children, routes = [], providers = [], ...props }: WebsiteProps) => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    // In development, debounce render by 1ms, to avoid router warnings about missing routes.
    const debounceMs = Number(process.env.NODE_ENV !== "production");

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <ThemeProvider>
                    <App
                        debounceRender={debounceMs}
                        routes={[...routes, { path: "*", element: <Page /> }]}
                        providers={[PageBuilderProviderHOC, ...providers]}
                    >
                        {children}
                    </App>
                </ThemeProvider>
            </ApolloProvider>
        </CacheProvider>
    );
};
