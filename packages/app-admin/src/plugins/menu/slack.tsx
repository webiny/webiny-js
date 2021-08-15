import React from "react";
import { NavigationMenuElement } from "~/ui/elements/NavigationMenuElement";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";
import { UIViewPlugin } from "~/ui/UIView";
import { NavigationView } from "~/ui/views/NavigationView";

export default () => {
    return new UIViewPlugin<NavigationView>(NavigationView, view => {
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
