import * as React from "react";
import { Query } from "react-apollo";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { LIST_MENUS } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

const Menu = ({data}) => {
    //menu data passed through here
    const { component, ...vars } = data;
    const components = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );
    console.log("CHECKING MENU DATA::::::")
    console.log(components);
    const menu = components.find(cmp => cmp.componentName === component);
    const { theme } = usePageBuilder();

    if (!menu) {
        return <div>Selected menu component not found!</div>;
    }

    const { component: ListComponent } = menu;
    
    if (!ListComponent) {
        return <div>You must select a component to render your menu!</div>;
    }

    let sort = null;
    if (vars.sortBy) {
        console.log("VARS SORTING BY:::");
        sort = { [vars.sortBy]: parseInt(vars.sortDirection) || -1 };
    }
    console.log(vars);

    //variables might need to be reworked

   /// PbSearchInput required for search.

    const variables = {
        where: vars.where,
        sort,
        search,
        limit: parseInt(vars.resultsPerPage),
        after: undefined,
        before: undefined
    };

    return (
        <Query query={LIST_MENUS} variables={variables}>
            {({ data, loading, refetch }) => {
                if (loading) {
                    return <div>Loading...</div>;
                }

                const menus = get(data, "pageBuilder.menus");

                if (!menus || !menus.data.length) {
                    return <div>No menus match the criteria.</div>;
                }

                let prevPage = null;
                if (menus.meta.hasPreviousPage) {
                    prevPage = () => refetch({ ...variables, before: menus.meta.cursors.before });
                }

                let nextPage = null;
                if (menus.meta.hasNextPage) {
                    nextPage = () => refetch({ ...variables, after: menus.meta.cursors.after });
                }

                return (
                    <ListComponent
                        {...menus}
                        nextPage={nextPage}
                        prevPage={prevPage}
                        theme={theme}
                    />
                );
            }}
        </Query>
    );
};

export default React.memo(Menu);