// @flow
import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StoryProps, StorySandbox } from "webiny-storybook-utils/Story";
import readme from "./../Grid/README.md";

// $FlowFixMe
import { Grid, Cell, PropsType } from "./Grid";

const story = storiesOf("Components/Grid", module);

story.add("usage", () => {
    return (
        <Story>
            <StoryReadme>{readme}</StoryReadme>
            <StoryProps
                title={
                    <span>
                        <code>Cell</code> props
                    </span>
                }
            >
                {PropsType}
            </StoryProps>
            <StorySandbox title={"A simple grid."}>
                <Grid>
                    <Cell span={3} table={6} mobile={12}>
                        Apples
                    </Cell>
                    <Cell span={3} table={6} mobile={12}>
                        Oranges
                    </Cell>
                    <Cell span={3} table={6} mobile={12}>
                        Bananas
                    </Cell>
                    <Cell span={3} table={6} mobile={12}>
                        Strawberries
                    </Cell>
                </Grid>
            </StorySandbox>
        </Story>
    );
});
