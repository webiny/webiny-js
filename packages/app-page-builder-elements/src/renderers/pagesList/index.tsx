import React, { useState, useEffect, useRef } from "react";
import {
    DataLoader,
    DataLoaderResult,
    PagesListComponent as RenderPagesListComponent
} from "~/renderers/pagesList/types";
import { createRenderer } from "~/createRenderer";
import { useRenderer } from "~/hooks/useRenderer";
import { useOptionalPage } from "~/hooks/usePage";

export interface PagesListComponent {
    id: string;
    name: string;
    component: RenderPagesListComponent;
}

export interface CreatePagesListParams {
    dataLoader: DataLoader;
    pagesListComponents: PagesListComponent[] | (() => PagesListComponent[]);
}

interface Cursors {
    previous: string | null;
    current: string | null;
    next: string | null;
}

export type PagesListRenderer = ReturnType<typeof createPagesList>;

export const createPagesList = (params: CreatePagesListParams) => {
    const { dataLoader, pagesListComponents } = params;

    return createRenderer(() => {
        const { getElement } = useRenderer();
        const pageContext = useOptionalPage();
        const exclude = pageContext ? [pageContext.page.path] : [];

        const element = getElement();

        const { component, ...vars } = element.data;

        let sort = null;
        if (vars.sortBy && vars.sortDirection) {
            sort = `${vars.sortBy}_${vars.sortDirection.toUpperCase()}`;
        }

        const variables = {
            sort,
            where: {
                category: vars.category,
                tags: {
                    query: vars.tags,
                    rule: vars.tagsRule
                }
            },
            limit: parseInt(vars.resultsPerPage),
            after: null,
            exclude
        };

        const variablesHash = JSON.stringify(variables);

        const [data, setData] = useState<DataLoaderResult | null>(null);
        const [loading, setLoading] = useState(true);
        const [initialLoading, setInitialLoading] = useState(true);

        const [cursors, setCursors] = useState<Cursors>({
            previous: null,
            current: null,
            next: null
        });

        // Let's cache the data retrieved by the data loader and make the UX a bit smoother.
        const cache = useRef<Record<string, { cursors: Cursors; data: DataLoaderResult }>>({});

        const loadPage = (cursor: string | null = null) => {
            const updatedVariables = { ...variables, after: cursor };
            const updatedVariablesHash = JSON.stringify(updatedVariables);

            // If data is already in the cache, just use that.
            if (cache.current[updatedVariablesHash]) {
                const { data, cursors } = cache.current[updatedVariablesHash];
                setData(data);
                setCursors(cursors);
                return;
            }

            setLoading(true);
            dataLoader({ variables: updatedVariables }).then(data => {
                const page = {
                    data,
                    cursors: {
                        previous: cursors.current,
                        current: cursor,
                        next: data.meta.cursor
                    }
                };

                setData(page.data);
                setCursors(page.cursors);
                setLoading(false);
                setInitialLoading(false);

                // Make sure the data are cached.
                cache.current[updatedVariablesHash] = page;
            });
        };

        const hasPreviousPage = Boolean(cursors.current);
        const hasNextPage = Boolean(cursors.next);

        const previousPage = () => hasPreviousPage && loadPage(cursors.previous);
        const nextPage = () => hasNextPage && loadPage(cursors.next);

        useEffect(() => {
            cache.current = {};
            setCursors({ previous: null, current: null, next: null });
            setInitialLoading(true);
            loadPage();
        }, [variablesHash]);

        let pagesListComponentsList: PagesListComponent[];
        if (typeof pagesListComponents === "function") {
            pagesListComponentsList = pagesListComponents();
        } else {
            pagesListComponentsList = pagesListComponents;
        }

        const pagesListComponent = pagesListComponentsList.find(item => item.id === component);
        if (!pagesListComponent) {
            return <div>Selected page list component not found!</div>;
        }

        const { component: PagesListComponent } = pagesListComponent;

        return (
            <PagesListComponent
                variables={variables}
                loading={loading}
                initialLoading={initialLoading}
                data={data}
                hasPreviousPage={hasPreviousPage}
                previousPage={previousPage}
                hasNextPage={hasNextPage}
                nextPage={nextPage}
            />
        );
    });
};
