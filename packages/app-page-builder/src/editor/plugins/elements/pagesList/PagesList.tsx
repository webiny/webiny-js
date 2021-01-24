import * as React from "react";
import { useQuery } from "react-apollo";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { LIST_PUBLISHED_PAGES } from "./graphql";
import { plugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";
import { useState } from "react";

const PagesList = props => {
    const { component, ...vars } = props.data;
    const components = plugins.byType<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );
    const pageList = components.find(cmp => cmp.componentName === component);
    const { theme } = usePageBuilder();
    const [page, setPage] = useState(1);

    if (!pageList) {
        return <div>Selected page list component not found!</div>;
    }

    const { component: ListComponent } = pageList;

    let sort = null;
    if (vars.sortBy && vars.sortDirection) {
        sort = { [vars.sortBy]: vars.sortDirection };
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
        page
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
    if (listPublishedPages.meta.previousPage) {
        prevPage = () => setPage(listPublishedPages.meta.previousPage);
    }

    let nextPage = null;
    if (listPublishedPages.meta.nextPage) {
        nextPage = () => setPage(listPublishedPages.meta.nextPage);
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
