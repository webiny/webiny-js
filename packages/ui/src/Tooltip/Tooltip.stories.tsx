import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Tooltip/README.md";
import { Tooltip } from "./Tooltip";

const story = storiesOf("Components/Tooltip", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"A simple tooltip, triggered with a button"}>
                    <Tooltip content={<span>This is a tooltip.</span>}>
                        <span>Hover to see additional information.</span>
                    </Tooltip>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Tooltip] } }
);
