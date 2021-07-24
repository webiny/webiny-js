import React from "react";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as DocsIcon } from "~/assets/icons/icon-documentation.svg";

export default () => {
    return new NavigationViewPlugin(view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("documentation", {
                label: "Documentation",
                icon: <DocsIcon />,
                path: "https://docs.webiny.com/",
                rel: "noopener noreferrer"
            })
        );
    });
};
