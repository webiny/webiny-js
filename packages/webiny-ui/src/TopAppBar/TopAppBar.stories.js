// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "webiny-storybook-utils/Story";
import readme from "./../TopAppBar/README.md";
import { withKnobs, text } from "@storybook/addon-knobs";
import { Icon } from "./../Icon";

import { ReactComponent as AutoRenewIcon } from "./icons/baseline-autorenew-24px.svg";
import { ReactComponent as CloudDoneIcon } from "./icons/baseline-cloud_done-24px.svg";
import { ReactComponent as EnvelopeIcon } from "./icons/baseline-email-24px.svg";
import { ReactComponent as MenuIcon } from "./icons/baseline-menu-24px.svg";

// $FlowFixMe
import {
    TopAppBar,
    TopAppBarSection,
    TopAppBarNavigationIcon,
    TopAppBarTitle,
    TopAppBarActionItem
} from "./TopAppBar";

const story = storiesOf("Components/TopAppBar", module);
story.addDecorator(withKnobs);

/**
 * Top app bar is by default rendered with "position: fixed", which then messes up the presentation.
 * For demonstration purposes, we had to switch to absolute positioning.
 */

let appendedCssOverrides = false;
const appendCssOverrides = () => {
    if (appendedCssOverrides) {
        return;
    }

    appendedCssOverrides = true;
    const css = `.top-app-bar-storybook .mdc-top-app-bar { position: relative; top: 0 !important }
                .top-app-bar-storybook .mdc-top-app-bar img { background: none; }`,
        head = document.head || document.getElementsByTagName("head")[0],
        style = document.createElement("style");

    style.type = "text/css";
    style.appendChild(document.createTextNode(css));
    head.appendChild(style);
};

story.add("usage", () => {
    appendCssOverrides();

    const title = text("title", "Webiny");
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StorySandbox>
                <div className="top-app-bar-storybook">
                    <TopAppBar>
                        <TopAppBarSection alignStart>
                            <TopAppBarNavigationIcon>
                                <Icon icon={<MenuIcon />} />
                            </TopAppBarNavigationIcon>
                            <TopAppBarTitle>{title}</TopAppBarTitle>
                        </TopAppBarSection>
                        <TopAppBarSection alignEnd>
                            <TopAppBarActionItem>
                                <Icon icon={<CloudDoneIcon />} />
                            </TopAppBarActionItem>
                            <TopAppBarActionItem>
                                <Icon icon={<AutoRenewIcon />} />
                            </TopAppBarActionItem>
                            <TopAppBarActionItem>
                                <Icon icon={<EnvelopeIcon />} />
                            </TopAppBarActionItem>
                        </TopAppBarSection>
                    </TopAppBar>
                </div>
            </StorySandbox>
        </Story>
    );
});
