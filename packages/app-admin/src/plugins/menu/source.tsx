import React from "react";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { UIViewPlugin } from "~/ui/UIView";
import { NavigationView } from "~/ui/views/NavigationView";

export default () => {
    return new UIViewPlugin<NavigationView>(NavigationView, view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("github", {
                label: "Source",
                icon: <GithubIcon />,
                path: "https://github.com/webiny/webiny-js",
                rel: "noopener noreferrer",
                target: "_blank"
            })
        );
    });
};
