import React from "react";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";
import { UIViewPlugin } from "~/ui/UIView";
import { NavigationView } from "~/ui/views/NavigationView";

export default () => {
    return new UIViewPlugin<NavigationView>(NavigationView, view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("documentation", {
                label: "Documentation",
                icon: <DocsIcon />,
                path: "https://docs.webiny.com/",
                rel: "noopener noreferrer",
                target: "_blank"
            })
        );
    });
};
