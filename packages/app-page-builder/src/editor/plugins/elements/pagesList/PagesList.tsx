import * as React from "react";
import { Query } from "@apollo/client/react/components";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { loadPages } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";

const PagesList = ({ data }) => {
    const { component, ...vars } = data;
    const components = getPlugins<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );
    const pageList = components.find(cmp => cmp.componentName === component);
    const { theme } = usePageBuilder();

    if (!pageList) {
        return <div>Selected page list component not found!</div>;
    }

    const { component: ListComponent } = pageList;

    if (!ListComponent) {
        return <div>You must select a component to render your list!</div>;
    }

    let sort = null;
    if (vars.sortBy) {
        sort = { [vars.sortBy]: parseInt(vars.sortDirection) || -1 };
    }

    const variables = {
        category: vars.category,
        sort,
        tags: vars.tags,
        tagsRule: vars.tagsRule,
        limit: parseInt(vars.resultsPerPage),
        after: undefined,
        before: undefined
    };

    return (
        <Query query={loadPages} variables={variables}>
            {({ data, loading, refetch }) => {
                if (loading) {
                    return <div>Loading...</div>;
                }

                const pages = get(data, "pageBuilder.listPublishedPages");

                if (!pages || !pages.data.length) {
                    return <div>No pages match the criteria.</div>;
                }

                let prevPage = null;
                if (pages.meta.hasPreviousPage) {
                    prevPage = () => refetch({ ...variables, before: pages.meta.cursors.before });
                }

                let nextPage = null;
                if (pages.meta.hasNextPage) {
                    nextPage = () => refetch({ ...variables, after: pages.meta.cursors.after });
                }

                return (
                    <ListComponent
                        {...pages}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        theme={theme}
                    />
                );
            }}
        </Query>
    );
};

export default React.memo(PagesList);
