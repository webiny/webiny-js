import * as React from "react";
import warning from "warning";
import { useQuery } from "react-apollo";
import { LIST_MENUS, READ_MENU } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

import { css } from "emotion";
const outerWrapper = css({
    boxSizing: "border-box"
});

const innerWrapper = css({
    left: 0,
    width: "100%",
    height: "auto",
    position: "relative",
    paddingBottom: 0
});

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
        data: { component, settings: {
            menu: {
                element: menuId
            }
        }, ...vars },
        theme
    } = props;

    console.log("PLUGINS FROM RENDER::::::::::::");
    console.log(props);

    console.log(menuId);
    /*
    data.settings.menu.element
    {data: {…}, theme: {…}}
data:
component: "default"
settings:
menu: {element: "5f4fafed4221bf0008a483c8"}
    */
    const plugins = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );

    const menuComponent = plugins.find(cmp => cmp.componentName === component);
    console.log(menuComponent);

    if (!menuComponent) {
        warning(false, `Menu component "${component}" is missing!`);
        return null;
    }
    const { component: MenuComponent } = menuComponent;

    if (!MenuComponent) {
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
        id: menuId
    };

    const { data, loading, refetch } = useQuery(READ_MENU, { variables });

    if (loading) {
        return null;
    }
    console.log("rendered data::::");
    console.log(data);
    /*
    pageBuilder:
menu:
data:
description: "ssss"
id: "5f4fafed4221bf0008a483c8"
items: (2) [{…}, {…}]
slug: "sssss"
title: "ssssssssss"
__typename: "PbMenu"
    */
  /* pageBuilder:
menu:
data:
description: "ssss"
id: "5f4fafed4221bf0008a483c8"
items: (2) [{…}, {…}]
slug: "sssss"
title: "ssssssssss"
__typename: "PbMenu"*/
    const menuData = data.pageBuilder.menu;

    /*if (!menuData || !menuData.data.length) {
        return null;
    }*/
    /*
    let prevPage = null;
    if (menuData.meta.hasPreviousPage) {
        prevPage = () => refetch({ ...variables, before: menuData.meta.cursors.previous });
    }*/

    /*    let nextPage = null;
    if (menus.meta.hasNextPage) {
        nextPage = () => refetch({ ...variables, after: menus.meta.cursors.next });
    }*/
    console.log("List Component JSX:::::")
    let render = <span>Menu not selected.</span>;
    if (menuData){
        //data.ie
        const props = {
            preview: true,
            menu: menuData.data.id,
        };
        render = <MenuComponent {...props} />;
    }
    return (
        <>
            <ssr-cache data-class="pb-menu" />
            {render}
        </>
    );
}

export default React.memo(Menu);
