import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ProgressBar } from "./ProgressBar.js";

const meta: Meta<typeof ProgressBar> = {
    title: "Components/ProgressBar",
    component: ProgressBar,
    parameters: {
        layout: "padded"
    }
};

export const Documentation: Story = {
    args: {
        value: 50
    },
    argTypes: {
        value: {
            description: "Current progress value (0-100)",
            control: { type: "number", min: 0, max: 100 }
        },
        max: {
            description: "Maximum value for the progress bar. Defaults to 100.",
            control: { type: "number", min: 1 }
        },
        valuePosition: {
            description:
                "Position of the value label relative to the progress bar. Can be 'start', 'end',  or 'both'. Defaults to 'undefined'.",
            control: {
                type: "select",
                options: ["start", "end", "both"]
            }
        }
    }
};

export default meta;
type Story = StoryObj<typeof ProgressBar>;

export const Default: Story = {
    args: {
        value: 50
    }
};

export const WithCustomMaxValue: Story = {
    args: {
        ...Default.args,
        max: 200
    }
};

export const WithValuePositionStart: Story = {
    args: {
        ...Default.args,
        valuePosition: "start"
    }
};

export const WithValuePositionEnd: Story = {
    args: {
        ...Default.args,
        valuePosition: "end"
    }
};

export const WithValuePositionBoth: Story = {
    args: {
        ...Default.args,
        valuePosition: "both"
    }
};

export const WithGetValueLabel: Story = {
    args: {
        ...Default.args,
        getValueLabel: (value: number) => `${value} mb`
    }
};

export const WithControlledValue: Story = {
    args: {
        value: 0
    },
    render: args => {
        const [value, setValue] = useState(args.value);

        useEffect(() => {
            const interval = setInterval(() => {
                setValue((prevValue = 0) => {
                    const value = Number(prevValue);

                    if (value === 100) {
                        return value;
                    }
                    return value + 5;
                });
            }, 100);

            return () => clearInterval(interval);
        }, []);

        return <ProgressBar {...args} value={value} />;
    }
};
