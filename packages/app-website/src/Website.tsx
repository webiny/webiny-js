import React from "react";
import { App, AppProps, HigherOrderComponent } from "@webiny/app";
import { ApolloProvider } from "@apollo/react-hooks";
import { PageBuilderProvider } from "@webiny/app-page-builder/contexts/PageBuilder";
import { Page } from "./Page";
import { EmotionProvider } from "./Website/EmotionProvider";
import { createApolloClient } from "~/utils";

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

export const Website: React.FC<WebsiteProps> = ({
    children,
    routes = [],
    providers = [],
    ...props
}) => {
    const apolloClient = props.apolloClient || createApolloClient();

    // In development, debounce render by 1ms, to avoid router warnings about missing routes.
    const debounceMs = Number(process.env.NODE_ENV !== "production");

    return (
        <EmotionProvider>
            <ApolloProvider client={apolloClient}>
                <App
                    debounceRender={debounceMs}
                    routes={[...routes, { path: "*", element: <Page /> }]}
                    providers={[PageBuilderProviderHOC, ...providers]}
                >
                    {children}
                </App>
            </ApolloProvider>
        </EmotionProvider>
    );
};
