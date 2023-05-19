import React from "react";
import { App, AppProps, HigherOrderComponent } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { CacheProvider } from "@emotion/react";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { I18NProvider } from "@webiny/app-i18n/contexts/I18N";
import { CmsProvider } from "@webiny/app-headless-cms/admin/contexts/Cms";
import { Page } from "./Page";
import { createApolloClient, createEmotionCache } from "~/utils";
import { createApolloClient as createCmsClient } from "@webiny/app-serverless-cms/apolloClientFactory";

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

const CmsProviderHOC: HigherOrderComponent = PreviousProvider => {
    return function PageBuilderProviderHOC({ children }) {
        return (
            <I18NProvider>
                <CmsProvider createApolloClient={createCmsClient}>
                    <PreviousProvider>{children}</PreviousProvider>
                </CmsProvider>
            </I18NProvider>
        );
    };
};

export const Website: React.FC<WebsiteProps> = ({
    children,
    routes = [],
    providers = [],
    ...props
}) => {
    const apolloClient = props.apolloClient || createApolloClient();
    const emotionCache = createEmotionCache();

    // In development, debounce render by 1ms, to avoid router warnings about missing routes.
    const debounceMs = Number(process.env.NODE_ENV !== "production");

    return (
        <CacheProvider value={emotionCache}>
            <ApolloProvider client={apolloClient}>
                <App
                    debounceRender={debounceMs}
                    routes={[...routes, { path: "*", element: <Page /> }]}
                    providers={[PageBuilderProviderHOC, CmsProviderHOC, ...providers]}
                >
                    {children}
                </App>
            </ApolloProvider>
        </CacheProvider>
    );
};
