import React from "react";
import { UIRenderer, UIRenderParams } from "~/ui/UIRenderer";
import { NavigationView } from "~/ui/views/NavigationView";
import { Drawer } from "@webiny/ui/Drawer";

export class NavigationViewRenderer extends UIRenderer<NavigationView> {
    render({ element, children }: UIRenderParams<NavigationView>): React.ReactNode {
        const { menuIsShown, hideMenu } = element.getNavigationHook();

        return (
            <Drawer modal open={menuIsShown()} onClose={hideMenu}>
                {children()}
            </Drawer>
        );
    }
}
