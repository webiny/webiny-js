//using page list as an template example
//https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/render/plugins/elements/pagesList/PagesList.tsx

import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { loadMenus } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

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

const Menu = props => {
    const {
        data: { component, ...vars },
        theme
    } = props;

    const plugins = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );

    const menu = plugins.find(cmp => cmp.componentName === component);

    if (!menu) {
        warning(false, `Menu component "${component}" is missing!`);
        return null;
    }
    const { component: ListComponent } = menu;

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
            <ssr-cache data-class="pb-menu" />
            <ListComponent {...pages} nextPage={nextPage} prevPage={prevPage} theme={theme} />
        </>
    );
}

export default React.memo(Menu);