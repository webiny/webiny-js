import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./README.md";
import { Menu, MenuItem } from "./../../Menu/index";

import { CopyButton } from "./CopyButton";

const story = storiesOf("Components/Button", module);

story.add(
    "copy button",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"Copy button"}>
                    <div>
                        <span>Click the button to copy the "Hello" value:</span>
                        <CopyButton value="Hello" />
                    </div>
                </StorySandbox>
            </Story>
        );
    },
    {
        info: {
            propTablesExclude: [Menu, MenuItem, Story, StoryReadme, StorySandbox]
        }
    }
);
