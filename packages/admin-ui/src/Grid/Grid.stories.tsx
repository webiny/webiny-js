import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Grid } from "./Grid";

const meta: Meta<typeof Grid> = {
    title: "Components/Grid",
    component: Grid,
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
    args: {
        gap: 2,
        children: (
            <>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 1</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"} span={3}>
                    Column 2 with <code>span</code> set to <code>3</code>
                </Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 3</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 4</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 5</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 6</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"} span={2}>
                    Column 7 with <code>span</code> set to <code>2</code>
                </Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 8</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 9</Grid.Column>
            </>
        )
    }
};

export const DifferentNumberOfColumns: Story = {
    args: {
        columns: 4,
        gap: 2,
        children: (
            <>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 1</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 2</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 3</Grid.Column>
                <Grid.Column className={"bg-muted rounded p-2"}>Column 4</Grid.Column>
            </>
        )
    }
};
