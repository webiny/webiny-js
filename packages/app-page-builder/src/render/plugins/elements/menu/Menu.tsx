//using page list as an template example
//https://github.com/webiny/webiny-js/blob/master/packages/app-page-builder/src/render/plugins/elements/pagesList/PagesList.tsx

import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { LIST_MENUS } from "./graphql";
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

    console.log("PLUGINS FROM RENDER::::::::::::");
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
    /*
        query listMenus(
        $where: JSON
        $sort: JSON
        $search: PbSearchInput
        $limit: Int
        $after: String
        $before: String
    ) {
    */
   //$search: PbSearchInput
   const variables = {
        where: vars.where,
        sort,
        limit: parseInt(vars.resultsPerPage),
        after: undefined,
        before: undefined
    }
   /*
    const variables = {
        category: vars.category,
        sort,
        tags: vars.tags,
        tagsRule: vars.tagsRule,
        limit: parseInt(vars.resultsPerPage),
        after: undefined,
        before: undefined
    };
    */

    const { data, loading, refetch } = useQuery(LIST_MENUS, { variables });

    if (loading) {
        return null;
    }

    const menus = data.pageBuilder.menus;

    if (!menus || !menus.data.length) {
        return null;
    }

    let prevPage = null;
    if (menus.meta.hasPreviousPage) {
        prevPage = () => refetch({ ...variables, before: menus.meta.cursors.previous });
    }

    let nextPage = null;
    if (menus.meta.hasNextPage) {
        nextPage = () => refetch({ ...variables, after: menus.meta.cursors.next });
    }
    console.log("List Component JSX:::::")
    return (
        <>
            <ssr-cache data-class="pb-menu" />
            <ListComponent {...menus} nextPage={nextPage} prevPage={prevPage} theme={theme} />
        </>
    );
}

export default React.memo(Menu);