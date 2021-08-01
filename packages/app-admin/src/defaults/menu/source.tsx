import React from "react";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { UIViewPlugin } from "@webiny/ui-composer/UIView";
import { NavigationView } from "~/views/NavigationView";

export default () => {
    return new UIViewPlugin<NavigationView>(NavigationView, view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("github", {
                label: "Source",
                icon: <GithubIcon />,
                path: "https://github.com/webiny/webiny-js",
                rel: "noopener noreferrer"
            })
        );
    });
};
