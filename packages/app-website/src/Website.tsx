import React from "react";
import { App, AppProps, Decorator, GenericComponent } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/react";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";
import { ThemeProvider } from "@webiny/app-theme";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { PageBuilder } from "@webiny/app-page-builder/render";
import { RouteProps } from "@webiny/react-router";
import { LinkPreload } from "~/LinkPreload";

export interface WebsiteProps extends AppProps {
    apolloClient?: ReturnType<typeof createApolloClient>;
}

const PageBuilderProviderHOC: Decorator<
    GenericComponent<{ children: React.ReactNode }>
> = PreviousProvider => {
    return function PageBuilderProviderHOC({ children }) {
        return (
            <PageBuilderProvider>
                <PreviousProvider>{children}</PreviousProvider>
            </PageBuilderProvider>
        );
    };
};

const defaultRoute: RouteProps = { path: "*", element: <Page /> };

export const Website = ({ children, routes = [], providers = [], ...props }: WebsiteProps) => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    // In development, debounce render by 1ms, to avoid router warnings about missing routes.
    const debounceMs = Number(process.env.NODE_ENV !== "production");

    // Check if there's a user-defined "*" route.
    const wildcardRoute = routes.find(route => route.path === "*");

    const appRoutes = wildcardRoute ? routes : [...routes, defaultRoute];

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <ThemeProvider>
                    <App
                        debounceRender={debounceMs}
                        routes={appRoutes}
                        providers={[PageBuilderProviderHOC, ...providers]}
                    >
                        <LinkPreload />
                        <PageBuilder />
                        {children}
                    </App>
                </ThemeProvider>
            </ApolloProvider>
        </CacheProvider>
    );
};
