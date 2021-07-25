import React from "react";
import { Drawer } from "@webiny/ui/Drawer";
import { View } from "@webiny/ui-composer/View";
import { UseSecurity, useSecurity } from "@webiny/app-security";
import { plugins } from "@webiny/plugins";
import { HeaderElement } from "./NavigationView/HeaderElement";
import { ContentElement } from "./NavigationView/ContentElement";
import { FooterElement } from "./NavigationView/FooterElement";
import { useNavigation, UseNavigation } from "~/views/NavigationView/useNavigation";

export enum ElementID {
    Header = "navigationHeader",
    Content = "navigationContent",
    Footer = "navigationFooter"
}

export class NavigationView extends View {
    constructor() {
        super("navigation-view");
        
        this.toggleGrid(false);
        this.addHookDefinition("navigation", useNavigation);
        this.addHookDefinition("security", useSecurity);

        const elementConfig = {
            closeMenu: () => this.getHook<UseNavigation>("navigation").hideMenu()
        };

        this.addElement(new HeaderElement(ElementID.Header, elementConfig));
        this.addElement(new ContentElement(ElementID.Content));
        this.addElement(new FooterElement(ElementID.Footer, elementConfig));
    }

    getNavigationHook(): UseNavigation {
        return this.getHook("navigation");
    }

    getSecurityHook(): UseSecurity {
        return this.getHook("security");
    }

    getHeaderElement(): HeaderElement {
        return this.getElement(ElementID.Header);
    }

    getContentElement(): ContentElement {
        return this.getElement(ElementID.Content);
    }

    getFooterElement(): FooterElement {
        return this.getElement(ElementID.Footer);
    }

    render(props?: any): React.ReactNode {
        const { menuIsShown, hideMenu } = this.getNavigationHook();

        return (
            <Drawer modal open={menuIsShown()} onClose={hideMenu}>
                {super.render(props)}
            </Drawer>
        );
    }
}
