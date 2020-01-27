import React from "react";
import { storiesOf } from "@storybook/react";
import { Story, StoryReadme, StorySandbox } from "@webiny/storybook-utils/Story";
import readme from "./../Grid/README.md";
import { Grid, Cell } from "./Grid";

const story = storiesOf("Components/Grid", module);

story.add(
    "usage",
    () => {
        return (
            <Story>
                <StoryReadme>{readme}</StoryReadme>
                <StorySandbox title={"A simple grid."}>
                    <Grid>
                        <Cell span={3} tablet={6} phone={12}>
                            Apples
                        </Cell>
                        <Cell span={3} tablet={6} phone={12}>
                            Oranges
                        </Cell>
                        <Cell span={3} tablet={6} phone={12}>
                            Bananas
                        </Cell>
                        <Cell span={3} tablet={6} phone={12}>
                            Strawberries
                        </Cell>
                    </Grid>
                </StorySandbox>
            </Story>
        );
    },
    { info: { propTables: [Grid, Cell] } }
);
