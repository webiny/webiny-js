console.log("HELLO WORLD!!!!");
import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
import styled from "@emotion/styled";
import { connect } from "react-redux";
//import { Query } from "react-apollo";
//import { usePageBuilder } from "@webiny/app-page-builder/hooks/usePageBuilder";
//import { LIST_MENUS } from "./graphql";
//import { getPlugins } from "@webiny/plugins";
import { getActiveElementId } from "@webiny/app-page-builder/editor/selectors";
import { PbElement } from "@webiny/app-page-builder/types";

import { PbPageElementMenuComponentPlugin } from "@webiny/app-page-builder/types";

const Overlay = styled("div")({
    background: "black",
    position: "absolute",
    width: "100%",
    height: "100%",
    zIndex: 10,
    opacity: 0.25
});

export type MenuElementProps = {
    isActive: boolean;
    element: PbElement;
};

const Menu = (props: MenuElementProps) => {
    //menu data passed through here
    const { element, isActive } = props;
    console.log("MENU PROPS ::::;;;;");
    console.log(props);
    /*const components = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );*/
    //get dtata from here
    const menu = get(element, "data.settings.menu") || {};
    console.log("CHECKING MENU DATA FROM EDITOR::::::");
    console.log(menu);
    let render = <span>Form not selected.</span>;
    //console.log(vars);
    //const menu = components.find(cmp => cmp.componentName === component);
    //const { theme } = usePageBuilder();
    render = <FormsForm {...props} />;

    /*if (!menu) {
        return <div>Selected menu component not found!</div>;
    }*/

    //const { component: ListComponent } = menu;
    
    /*if (!ListComponent) {
        return <div>You must select a component to render your menu!</div>;
    }*/

    //let sort = null;
    /*if (vars.sortBy) {
        console.log("VARS SORTING BY:::");
        sort = { [vars.sortBy]: parseInt(vars.sortDirection) || -1 };
    }*/
    //console.log(vars);

    //variables might need to be reworked

   /// PbSearchInput required for search.
    //WORK FROM HERE
    //search, removed            $search: PbSearchInput
    //const resultsPerPage =  parseInt(vars.resultsPerPage);
    /*const variables = {
        where: vars.where,
        sort,
        limit: parseInt(vars.resultsPerPage),
        after: undefined,
        before: undefined
    };*/
    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-${menu.parent}`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {render}
            </ElementRoot>
        </>
    )
    /*return (
        <Query query={LIST_MENUS} variables={variables}>
            {({ data, loading, refetch }) => {
                if (loading) {
                    return <div>Loading...</div>;
                }
                //receiving data here
                const menus = get(data, "pageBuilder.menus");
                console.log("Menu menus :::::::;;;;;;;");
                console.log(menus);

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
    );*/
};

export default connect((state, props: any) => {
    console.log("state and props::::")
    console.log(state);
    console.log(props);
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(Menu);