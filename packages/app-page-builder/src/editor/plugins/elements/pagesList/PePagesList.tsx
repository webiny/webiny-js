import { PbPageElementPagesListComponentPlugin } from "~/types";
import {
    createPagesList,
    PagesListRenderer
} from "@webiny/app-page-builder-elements/renderers/pagesList";
import React, { useMemo } from "react";
import { plugins } from "@webiny/plugins";
import { useApolloClient } from "@apollo/react-hooks";
import gql from "graphql-tag";
import { LIST_PUBLISHED_PAGES } from "@webiny/app-page-builder-elements/renderers/pagesList/dataLoaders/defaultDataLoader";

export const PePagesList = (props: React.ComponentProps<PagesListRenderer>) => {
    // We wrap the original renderer in order to be able to provide the Apollo client.
    const apolloClient = useApolloClient();

    const Renderer = useMemo(() => {
        return createPagesList({
            dataLoader: ({ variables }) => {
                return apolloClient
                    .query({ query: gql(LIST_PUBLISHED_PAGES), variables })
                    .then(({ data }) => data.pageBuilder.listPublishedPages);
            },
            pagesListComponents: () => {
                const registeredPlugins = plugins.byType<PbPageElementPagesListComponentPlugin>(
                    "pb-page-element-pages-list-component"
                );

                return registeredPlugins.map(plugin => {
                    return {
                        id: plugin.componentName,
                        name: plugin.title,
                        component: plugin.component
                    };
                });
            }
        });
    }, []);

    return <Renderer {...props} />;
};
