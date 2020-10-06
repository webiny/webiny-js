import * as React from "react";
import warning from "warning";
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
    //vara and theme currently not being used
    const {
        data: { 
            component, 
            settings: {
                menu: {
                    element: menuId
                }
            }, 
            ...vars 
        },
        theme
    } = props;

    console.log("PLUGINS FROM RENDER:::::::props, menuId::::::::::");
    console.log(props);
    console.log(menuId);

    const plugins = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );

    const menuPlugin = plugins.find(cmp => cmp.componentName === component);
    console.log(menuPlugin);

    if (!menuPlugin) {
        warning(false, `Menu component "${component}" is missing!`);
        return null;
    }
    const { component: MenuComponent } = menuPlugin;

    if (!MenuComponent) {
        warning(false, `React component is not defined for "${component}"!`);
        return null;
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
            <ssr-cache data-class="pb-menu" />
            {render}
        </>
    );
}

export default React.memo(Menu);