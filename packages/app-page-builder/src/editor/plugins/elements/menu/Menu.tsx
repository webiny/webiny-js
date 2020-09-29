import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import { Form as FormsForm } from "@webiny/app-form-builder/components/Form";
//import { MenusForm } from "@webiny/app-page-builder/admin/views/Menus/MenusForm.tsx";
import { Menu } from "@webiny/ui/Menu";
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
    //
    let render = <span>Menu not selected.</span>;
    //console.log(vars);
    //const menu = components.find(cmp => cmp.componentName === component);
    //const { theme } = usePageBuilder();

    if (menu.element){
        render = <Menu {...props} />;
    }
    console.log("element:::::");
    console.log(element);
    console.log("render:::::");
    console.log(render);
    //removing key number menu.parent
    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-1`}
                element={element}
                className={"webiny-pb-element-form"}
            >
                {render}
            </ElementRoot>
        </>
    )
};

export default connect((state, props: any) => {
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(Menu);