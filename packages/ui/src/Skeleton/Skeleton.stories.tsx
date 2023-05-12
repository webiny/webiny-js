import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Skeleton/README.md";
import { Skeleton } from "./Skeleton";

const story = storiesOf("Components/Skeleton", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"A simple loading Skeleton, single line"}>
                    <Skeleton />
                </StorySandbox>
                <StorySandbox title={"A loading Skeleton, with 3 lines"}>
                    <Skeleton count={3} />
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Skeleton] } }
);
