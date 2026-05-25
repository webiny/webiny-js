import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SteppedProgress } from "./SteppedProgress.js";
import { ProgressItemState } from "~/SteppedProgress/domains/index.js";

const meta: Meta<typeof SteppedProgress> = {
    title: "Components/SteppedProgress",
    component: SteppedProgress,
    argTypes: {},
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof SteppedProgress>;

export const Default: Story = {
    args: {
        items: [
            {
                label: "Step"
            },
            {
                label: "Step In Progress",
                state: ProgressItemState.IN_PROGRESS
            },
            {
                label: "Step Completed",
                state: ProgressItemState.COMPLETED
            },
            {
                label: "Completed Affirmative",
                state: ProgressItemState.COMPLETED_AFFIRMATIVE
            }
        ]
    }
};

export const WithMultipleLines: Story = {
    decorators: [
        Story => (
            <div
                style={{
                    width: "240px"
                }}
            >
                <Story />
            </div>
        )
    ],
    args: {
        items: [
            {
                label: "Step but with multiple lines of text."
            },
            {
                label: "Step in progress but with multiple lines of text.",
                state: ProgressItemState.IN_PROGRESS
            },
            {
                label: "Step completed but with multiple lines of text.",
                state: ProgressItemState.COMPLETED
            },
            {
                label: "Completed affirmative but with multiple lines of text.",
                state: ProgressItemState.COMPLETED_AFFIRMATIVE
            }
        ]
    }
};

export const Disabled: Story = {
    args: {
        items: [
            {
                label: "Step",
                disabled: true
            },
            {
                label: "Step In Progress",
                state: ProgressItemState.IN_PROGRESS,
                disabled: true
            },
            {
                label: "Step Completed",
                state: ProgressItemState.COMPLETED,
                disabled: true
            },
            {
                label: "Completed Affirmative",
                state: ProgressItemState.COMPLETED_AFFIRMATIVE,
                disabled: true
            }
        ]
    }
};

export const Errored: Story = {
    args: {
        items: [
            {
                label: "Step",
                errored: true
            },
            {
                label: "Step In Progress",
                state: ProgressItemState.IN_PROGRESS,
                errored: true
            },
            {
                label: "Step Completed",
                state: ProgressItemState.COMPLETED,
                errored: true
            },
            {
                label: "Completed Affirmative",
                state: ProgressItemState.COMPLETED_AFFIRMATIVE,
                errored: true
            }
        ]
    }
};

export const DisabledAndErrored: Story = {
    args: {
        items: [
            {
                label: "Step",
                disabled: true,
                errored: true
            },
            {
                label: "Step In Progress",
                state: ProgressItemState.IN_PROGRESS,
                disabled: true,
                errored: true
            },
            {
                label: "Step Completed",
                state: ProgressItemState.COMPLETED,
                disabled: true,
                errored: true
            },
            {
                label: "Completed Affirmative",
                state: ProgressItemState.COMPLETED_AFFIRMATIVE,
                disabled: true,
                errored: true
            }
        ]
    }
};
