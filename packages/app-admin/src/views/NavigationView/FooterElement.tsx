import React from "react";
import { List, ListItem } from "@webiny/ui/List";
import { Element, ElementConfig } from "@webiny/ui-composer/Element";
import { MenuFooter, subFooter } from "./Styled";
import { plugins } from "@webiny/plugins";
import { AdminDrawerFooterMenuPlugin } from "~/types";
import { GenericElement } from "@webiny/ui-elements/GenericElement";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";

interface FooterElementConfig extends ElementConfig {
    closeMenu: () => void;
}

export class FooterElement extends Element<FooterElementConfig> {
    constructor(id: string, config: FooterElementConfig) {
        super(id);

        this.toggleGrid(false);

        const footerMenuPlugins = plugins.byType<AdminDrawerFooterMenuPlugin>(
            "admin-drawer-footer-menu"
        );

        const props = {
            hideMenu: () => config.closeMenu()
        };
        //
        // footerMenuPlugins &&
        //     footerMenuPlugins.forEach(plugin => {
        //         this.addElement(
        //             new GenericElement(plugin.name, () => {
        //                 return (
        //                     <React.Fragment key={plugin.name}>
        //                         {plugin.render(props)}
        //                     </React.Fragment>
        //                 );
        //             })
        //         );
        //     });
    }

    addMenuElement(element: NavigationMenuElement) {
        return this.addElement(element);
    }

    render(props?: any): React.ReactNode {
        return (
            <MenuFooter>
                <List nonInteractive>
                    {super.render(props)}
                    <ListItem ripple={false} className={subFooter}>
                        Webiny v{process.env.REACT_APP_WEBINY_VERSION}
                    </ListItem>
                </List>
            </MenuFooter>
        );
    }
}
