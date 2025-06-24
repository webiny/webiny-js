import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Grid } from "./Grid";
import { StyledColumn } from "./stories/StyledColumn";

const meta: Meta<typeof Grid> = {
    title: "Components/Grid",
    component: Grid,
    parameters: {
        layout: "padded"
    }
};

export default meta;

type Story = StoryObj<typeof Grid>;

export const Default: Story = {
    args: {
        className: "wby-bg-neutral-light wby-p-md wby-w-full",
        children: (
            <>
                <StyledColumn index={1} />
                <StyledColumn index={2} span={3} />
                <StyledColumn index={3} />
                <StyledColumn index={4} />
                <StyledColumn index={5} />
                <StyledColumn index={6} />
                <StyledColumn index={7} span={2} />
                <StyledColumn index={8} />
                <StyledColumn index={9} />
            </>
        )
    }
};

export const WithGapNone: Story = {
    args: {
        ...Default.args,
        gap: "none"
    }
};

export const WithGapMicro: Story = {
    args: {
        ...Default.args,
        gap: "micro"
    }
};

export const WithGapSmall: Story = {
    args: {
        ...Default.args,
        gap: "small"
    }
};

export const WithGapCompact: Story = {
    args: {
        ...Default.args,
        gap: "compact"
    }
};

export const WithGapComfortable: Story = {
    args: {
        ...Default.args,
        gap: "comfortable"
    }
};

export const WithGapSpacious: Story = {
    args: {
        ...Default.args,
        gap: "spacious"
    }
};

export const WithOffset: Story = {
    parameters: {
        layout: "padded"
    },
    args: {
        ...Default.args,
        children: (
            <>
                {/* Row 1 */}
                <StyledColumn span={8} offset={2} index={1} />
                <Grid.Column span={2} />

                {/* Row 2 */}
                <StyledColumn span={8} offset={4} index={1} />

                {/* Row 3 */}
                <StyledColumn span={10} offset={1} index={1} />
                <Grid.Column span={1} />

                {/* Row 4 */}
                <StyledColumn span={12} index={1} />
            </>
        )
    }
};

export const Documentation: Story = {
    render: args => {
        return (
            <Grid {...args}>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 1
                </Grid.Column>
                <Grid.Column
                    className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm"
                    span={3}
                >
                    Col 2<br />
                    Span: 3
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 3
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 4
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 5
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 6
                </Grid.Column>
                <Grid.Column
                    className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm"
                    span={2}
                >
                    Col 7<br />
                    Span: 2
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 8
                </Grid.Column>
                <Grid.Column className="wby-bg-primary wby-text-neutral-light wby-p-2 wby-text-md wby-rounded-sm">
                    Col 9
                </Grid.Column>
            </Grid>
        );
    },
    args: {
        gap: "comfortable",
        className: "wby-bg-neutral-light wby-p-md wby-w-full"
    },
    argTypes: {
        gap: {
            description: "Spacing between grid columns",
            control: "select",
            options: ["none", "micro", "small", "compact", "comfortable", "spacious"],
            defaultValue: "comfortable"
        },
        className: {
            description:
                "Additional CSS class names. You can pass multiple class names that will be applied to Grid.",
            control: "text"
        }
    }
};
