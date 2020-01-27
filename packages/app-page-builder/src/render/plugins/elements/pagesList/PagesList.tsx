import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { loadPages } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementPagesListComponentPlugin } from "@webiny/app-page-builder/types";

const PagesList = props => {
    const {
        data: { component, ...vars },
        theme
    } = props;

    const plugins = getPlugins<PbPageElementPagesListComponentPlugin>(
        "pb-page-element-pages-list-component"
    );

    const pageList = plugins.find(cmp => cmp.componentName === component);

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

    const { data, loading, refetch } = useQuery(loadPages, { variables });

    if (loading) {
        return null;
    }

    const pages = data.pageBuilder.listPublishedPages;

    if (!pages || !pages.data.length) {
        return null;
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
        <>
            <ssr-cache data-class="pb-pages-list" />
            <ListComponent {...pages} nextPage={nextPage} prevPage={prevPage} theme={theme} />
        </>
    );
};

export default React.memo(PagesList);
