import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { loadPages } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";

declare global {
    // eslint-disable-next-line
    namespace JSX {
        interface IntrinsicElements {
            "ssr-cache": {
                class?: string;
                id?: string;
            };
        }
    }
}

const PagesList = props => {
    console.log("PAGE LIST FROM RENDER 2::::::::::::::::::::");
    const {
        data: { component, ...vars },
        theme
    } = props;

    const plugins = getPlugins<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );
    
    const pageList = plugins.find(cmp => cmp.componentName === component);
    console.log(pageList);
    if (!pageList) {
        warning(false, `Pages list component "${component}" is missing!`);
        return null;
    }

    const { component: ListComponent } = pageList;

    if (!ListComponent) {
        warning(false, `React component is not defined for "${component}"!`);
        return null;
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

    const { data, loading, refetch } = useQuery(loadPages, { variables });

    if (loading) {
        return null;
    }

    const pages = data.pageBuilder.listPublishedPages;

    if (!pages || !pages.data.length) {
        return null;
    }

    let prevPage = null;
    if (pages.meta.hasPreviousPage) {
        prevPage = () => refetch({ ...variables, before: pages.meta.cursors.previous });
    }

    let nextPage = null;
    if (pages.meta.hasNextPage) {
        nextPage = () => refetch({ ...variables, after: pages.meta.cursors.next });
    }

    return (
        <>
            <ssr-cache data-class="pb-pages-list" />
            <ListComponent {...pages} nextPage={nextPage} prevPage={prevPage} theme={theme} />
        </>
    );
};

export default React.memo(PagesList);
