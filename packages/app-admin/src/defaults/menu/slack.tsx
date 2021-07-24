import React from "react";
import { NavigationViewPlugin } from "~/plugins/NavigationViewPlugin";
import { NavigationMenuElement } from "~/elements/NavigationMenuElement";
import { ReactComponent as SlackIcon } from "~/assets/icons/slack-logo.svg";

export default () => {
    return new NavigationViewPlugin(view => {
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
