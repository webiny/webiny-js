import * as React from "react";
import { ElementRoot } from "@webiny/app-page-builder/render/components/ElementRoot";
import { get } from "lodash";
import styled from "@emotion/styled";
import { connect } from "react-redux";
import { getPlugins } from "@webiny/plugins";
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
 
    const data = get(element, "data") || {};
    console.log("data:::::::::::");
    console.log(data);

    const component = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    ).find(cmp => cmp.componentName === data.component);

    let menuId;
   
    if ('settings' in data) {
        //SIMULAR TO:: const menu = get(element, "data.settings.menu") || {};
        menuId = data.settings.menu.element;
    } else {
        return <div>Selected menu component not found!</div>;
    }
    console.log(`menu ID: ${menuId}`);
    
    const { component: MenuComponent } = component;

    if (!MenuComponent) {
        return <div>You must select a component to render your menu!</div>;
    }
 
    let render = <span>Menu not selected.</span>;

    if (menuId){
        const props = {
            preview: true,
            menu: menuId,
        };
        render = <MenuComponent {...props} />;
    }

    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-1`}
                element={element}
                className={"webiny-pb-element-menu"}
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