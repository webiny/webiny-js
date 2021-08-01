import React from "react";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as GithubIcon } from "~/assets/icons/github-brands.svg";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "~/views/NavigationView";

export default () => {
    return new ViewPlugin<NavigationView>(NavigationView, view => {
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
