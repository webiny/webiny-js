import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { OverlayLoader } from "./OverlayLoader.js";

const meta: Meta<typeof OverlayLoader> = {
    title: "Components/Overlay Loader",
    component: OverlayLoader,
    parameters: {
        layout: "padded"
    },
    decorators: [
        Story => (
            <div>
                <Story />
                The OverlayLoader component covers its parent container with a semi-transparent
                overlay, typically used to indicate a loading state while keeping the background
                content visible but inactive.
            </div>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof OverlayLoader>;

export const Documentation: Story = {
    args: {
        size: "lg",
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

export const CircularProgressWithText: Story = {
    name: "With text",
    args: {
        text: "Loading..."
    }
};
