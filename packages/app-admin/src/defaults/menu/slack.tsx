import React from "react";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { ViewPlugin } from "@webiny/ui-composer/View";
import { NavigationView } from "~/views/NavigationView";

export default () => {
    return new ViewPlugin<NavigationView>(NavigationView, view => {
        view.getFooterElement().addMenuElement(
            new NavigationMenuElement("slack", {
                label: "Slack",
                icon: <SlackIcon />,
                path: "https://www.webiny.com/slack/",
                rel: "noopener noreferrer"
            })
        );
    });
};
