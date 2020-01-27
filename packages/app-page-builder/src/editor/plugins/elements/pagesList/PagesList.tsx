import * as React from "react";
import { Query } from "react-apollo";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { loadPages } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";

const PagesList = ({ data }) => {
    const { component, ...vars } = data;
    const components = getPlugins<PbPageElementPagesListComponentPlugin>(
        "pb-editor-page-element-pages-list-component"
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
        sort = { [vars.sortBy]: vars.sortDirection || -1 };
    }

    const variables = {
        category: vars.category,
        sort,
        tags: vars.tags,
        tagsRule: vars.tagsRule,
        perPage: parseInt(vars.resultsPerPage),
        pagesLimit: parseInt(vars.pagesLimit),
        page: 1
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
                if (pages.meta.previousPage !== null) {
                    prevPage = () => refetch({ ...variables, page: pages.meta.previousPage });
                }

                let nextPage = null;
                if (pages.meta.nextPage !== null) {
                    if (!variables.pagesLimit || variables.pagesLimit >= pages.meta.nextPage) {
                        nextPage = () => refetch({ ...variables, page: pages.meta.nextPage });
                    }
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
