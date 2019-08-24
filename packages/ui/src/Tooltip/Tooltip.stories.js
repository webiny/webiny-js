// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StoryProps, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Tooltip/README.md";

// $FlowFixMe
import { Tooltip, PropsType } from "./Tooltip";

const story = storiesOf("Components/Tooltip", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps>{PropsType}</StoryProps>
            <StorySandbox title={"A simple tooltip, triggered with a button"}>
                <Tooltip content={<span>This is a tooltip.</span>}>
                    <span>Hover to see additional information.</span>
                </Tooltip>
            </StorySandbox>
        </Story>
    );
});
