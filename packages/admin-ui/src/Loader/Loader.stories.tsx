import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Loader } from "./Loader.js";

const meta: Meta<typeof Loader> = {
    title: "Components/Loader",
    component: Loader,
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof Loader>;

export const Documentation: Story = {
    args: {
        size: "md",
        variant: "accent",
        indeterminate: true,
        value: 66,
        min: 0,
        max: 100,
        text: "Loading...",
        className: undefined
    },
    argTypes: {
        size: {
            description: "Size of the loader",
            control: "select",
            options: ["xs", "sm", "md", "lg"]
        },
        variant: {
            description: "Visual style variant of the loader",
            control: "select",
            options: ["accent", "subtle", "negative"]
        },
        indeterminate: {
            description: "Whether the loader should show indeterminate progress",
            control: "boolean"
        },
        value: {
            description: "Current progress value (when not indeterminate)",
            control: { type: "number", min: 0, max: 100 }
        },
        min: {
            description: "Minimum value for progress calculation",
            control: "number"
        },
        max: {
            description: "Maximum value for progress calculation",
            control: "number"
        },
        text: {
            description: "Optional text to display below the loader",
            control: "text"
        },
        className: {
            description:
                "Additional CSS class names. You can pass multiple class names, separated by commas or spaces."
        }
    }
};

export const Default: Story = {};

export const ExtraSmall: Story = {
    args: {
        size: "xs"
    }
};

export const Small: Story = {
    args: {
        size: "sm"
    }
};

export const Medium: Story = {
    args: {
        size: "md"
    }
};

export const Large: Story = {
    args: {
        size: "lg"
    }
};

export const Accent: Story = {
    args: {
        variant: "accent"
    }
};

export const Subtle: Story = {
    args: {
        variant: "subtle"
    }
};

export const Negative: Story = {
    args: {
        variant: "negative"
    },
    decorators: [
        Story => (
            <div className="bg-primary p-md rounded-md">
                <Story />
            </div>
        )
    ]
};

export const WithControlledValue: Story = {
    args: {
        value: 0,
        indeterminate: false
    },
    render: args => {
        const [value, setValue] = useState(args.value);

        useEffect(() => {
            const interval = setInterval(() => {
                setValue((prevValue = 0) => {
                    if (prevValue === 100) {
                        return prevValue;
                    }
                    return prevValue + 5;
                });
            }, 50);

            return () => clearInterval(interval);
        }, []);

        return <Loader {...args} value={value} text={`Loading ${value}%`} />;
    }
};

export const WithText: Story = {
    args: {
        text: "Loading..."
    }
};
