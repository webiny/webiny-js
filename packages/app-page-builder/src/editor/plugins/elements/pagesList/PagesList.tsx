import React, { useState } from "react";
import { useQuery } from "@apollo/react-hooks";
import { usePageBuilder } from "~/hooks/usePageBuilder";
import { LIST_PUBLISHED_PAGES } from "./graphql";
import { plugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementPagesListComponentPlugin } from "~/types";
import { usePage } from "~/pageEditor/hooks/usePage";

interface PagesListProps {
    data: {
        component: string;
        sortBy: string;
        sortDirection: "asc" | "desc";
        category: string;
        tags: string;
        tagsRule: "any" | "all";
        resultsPerPage: string;
    };
}
const PagesList: React.FC<PagesListProps> = props => {
    const { component, ...vars } = props.data;
    const components = plugins.byType<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );
    const pageList = components.find(cmp => cmp.componentName === component);
    const { theme } = usePageBuilder();
    const [cursors, setCursors] = useState([null]);
    const [page, setPage] = useState(0);
    const [pageAtomValue] = usePage();

    if (!pageList) {
        return <div>Selected page list component not found!</div>;
    }

    const { component: ListComponent } = pageList;

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
        after: cursors[page],
        exclude: [pageAtomValue.path]
    };

    const { data, loading } = useQuery(LIST_PUBLISHED_PAGES, {
        variables,
        skip: !ListComponent,
        fetchPolicy: "network-only"
    });

    if (!ListComponent) {
        return <div>You must select a component to render your list!</div>;
    }

    if (loading) {
        return <div>Loading...</div>;
    }

    const totalCount = get(data, "pageBuilder.listPublishedPages.meta.totalCount");
    if (!totalCount) {
        return <div>No pages match the criteria.</div>;
    }

    const listPublishedPages = get(data, "pageBuilder.listPublishedPages");

    let prevPage = null;
    if (page >= 1) {
        prevPage = () => {
            setPage(page => page - 1);
        };
    }

    let nextPage = null;
    if (listPublishedPages.meta.cursor) {
        nextPage = () => {
            setCursors(cursors => [...cursors, listPublishedPages.meta.cursor]);
            setPage(page => page + 1);
        };
    }

    return (
        <ListComponent
            {...listPublishedPages}
            nextPage={nextPage}
            prevPage={prevPage}
            theme={theme}
        />
    );
};

export default React.memo(PagesList);
