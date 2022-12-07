import React, { useState, useEffect, useRef } from "react";
import { usePageElements } from "~/hooks/usePageElements";
import { ElementRenderer, Element } from "~/types";
import styled from "@emotion/styled";
import { DataLoader, DataLoaderResult, PagesListComponent as RenderPagesListComponent } from "~/renderers/pagesList/types";
import { elementDataPropsAreEqual } from "~/utils";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "pb-pages-list": any;
            "pb-pages-list-body": any;
            "pb-pages-list-icon": any;
            "pb-pages-list-text": any;
        }
    }
}

export interface CreatePagesListParams {
    dataLoader: DataLoader;
    pagesListComponents: Record<string, RenderPagesListComponent>;
}

const PbPagesList: React.FC<{ className?: string; element: Element }> = ({
    className,
    children,
    element
}) => (
    <pb-pages-list data-pe-id={element.id} class={className}>
        {children}
    </pb-pages-list>
);

interface Cursors {
    previous: string | null;
    current: string | null;
    next: string | null;
}

export type PagesListComponent = ReturnType<typeof createPagesList>;

export const createPagesList = (params: CreatePagesListParams) => {
    const { dataLoader, pagesListComponents } = params;

    const PagesList: ElementRenderer = ({ element }) => {
        const { getElementStyles, getThemeStyles } = usePageElements();

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
            exclude: []
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

        // Let's cached the data retrieved by the data loader and make the UX a bit smoother.
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

        const PagesListComponent = pagesListComponents[component];
        if (!PagesListComponent) {
            return <div>Selected page list component not found!</div>;
        }

        const themeStyles = getThemeStyles(theme => {
            return theme.styles.pagesList;
        });

        const elementStyles = getElementStyles(element);

        const styles = [...themeStyles, ...elementStyles];
        const StyledPbPagesList = styled(PbPagesList)(styles);

        return (
            <StyledPbPagesList element={element}>
                <PagesListComponent
                    // @ts-ignore
                    variables={variables}
                    loading={loading}
                    initialLoading={initialLoading}
                    data={data}
                    hasPreviousPage={hasPreviousPage}
                    previousPage={previousPage}
                    hasNextPage={hasNextPage}
                    nextPage={nextPage}
                />
            </StyledPbPagesList>
        );
    };

    return Object.assign(React.memo(PagesList, elementDataPropsAreEqual), {
        params
    });
};
