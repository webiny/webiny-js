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
    if(!props?.data?.settings?.menu?.element){
        return <span>No Menu Found.</span>
    }
    
    const {
        data: { 
            settings: {
                menu: {
                    element: menuID,
                    component
                },
            }, 
            ...vars 
        },
        theme
    } = props;


    console.log("PLUGINS FROM RENDER:::::::props, menuId::::::::::");
    console.log(props);
    console.log(menuID);

    const plugins = getPlugins<PbPageElementMenuComponentPlugin>(
        "pb-page-element-menu-component"
    );
    console.log(plugins);
    console.log(component)
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
   
    
    const render = (menuId?: string) => {
        if (!menuId) {
          return <span>Menu not selected.</span>;
        }
        return <MenuComponent menu={menuId} preview={true} />;
    }
    console.log("rendering:::::::")
    return (
        <>
            <ssr-cache data-class="pb-menu" />
            {render(menuID)}
        </>
    );
}

export default React.memo(Menu);