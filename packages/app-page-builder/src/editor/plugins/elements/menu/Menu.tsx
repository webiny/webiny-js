import * as React from "react";
import { Query } from "react-apollo";
import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
import { loadPages } from "./graphql";
import { getPlugins } from "@webiny/plugins";
import { get } from "lodash";
import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

const Menu = ({data}) => {
    //menu data passed through here
    const { component, ...vars } = data;
    const components = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );
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

export default React.memo(Menu);