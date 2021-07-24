import React from "react";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";

export default () => {
    return new NavigationViewPlugin(view => {
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
