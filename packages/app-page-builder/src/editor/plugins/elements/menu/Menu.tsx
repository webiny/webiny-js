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

const Menu = ({ element, isActive }) => {
    console.log("MENU ELEMENT isActive ::::;;;;");
    console.log(element);
    console.log(isActive);
 
    const data = element?.data || {};
    console.log("data:::::::::::");
    console.log(data);

    const component = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    ).find(cmp => cmp.componentName === data.component);
   
 
    if (!data?.settings) {
        return <div>Selected menu component not found!</div>
    }
    
    const { component: MenuComponent } = component;

    if (!MenuComponent) {
        return <div>You must select a component to render your menu!</div>;
    }
 
    const render = (menuId?: string) => {
        if (!menuId) {
          return <span>Menu not selected.</span>;
        }
        return <MenuComponent menu={menuId} preview={true} />;
    }

    return (
        <>
            {isActive && <Overlay />}
            <ElementRoot
                key={`form-1`}
                element={element}
                className={"webiny-pb-element-menu"}
            >
                {render(data?.settings?.menu?.element)}
            </ElementRoot>
        </>
    )
};

export default connect((state, props: any) => {
    return {
        isActive: getActiveElementId(state) === props.element.id
    };
})(Menu);