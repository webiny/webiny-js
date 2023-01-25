import React from "react";
import { AddRoute, App, createProviderPlugin, Plugins } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/core";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";
import { ThemeLoader } from "@webiny/app-theme-manager/components/ThemeLoader";
import { ThemeSource } from "@webiny/app-theme-manager/types";

interface Props {
    apolloClient?: ReturnType<typeof createApolloClient>;
    themes?: ThemeSource[];
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

const createThemeLoaderPlugin = (themes: ThemeSource[]) => {
    return createProviderPlugin(PreviousProvider => {
        return function PageBuilderProviderHOC({ children }) {
            if (themes.length > 0) {
                return (
                    <ThemeLoader themes={themes}>
                        <PreviousProvider>{children}</PreviousProvider>
                    </ThemeLoader>
                );
            }

            return <PreviousProvider>{children}</PreviousProvider>;
        };
    });
};

export const Website: React.FC<Props> = ({ children, ...props }) => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();
    const ThemeLoaderPlugin = createThemeLoaderPlugin(props.themes || []);

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <App debounceRender={0}>
                    <PageBuilderProviderPlugin />
                    <ThemeLoaderPlugin />
                    <Plugins>
                        <AddRoute path={"*"} element={<Page />} />
                    </Plugins>
                    {children}
                </App>
            </ApolloProvider>
        </CacheProvider>
    );
};
