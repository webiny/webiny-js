import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RangeSlider } from "./RangeSlider";
import { TooltipProvider } from "~/Tooltip";

const meta: Meta<typeof RangeSlider> = {
    title: "Components/RangeSlider",
    component: RangeSlider,
    tags: ["autodocs"],
    argTypes: {
        onValueChange: { action: "onValueChange" },
        onValueCommit: { action: "onValueCommit" }
    },
    parameters: {
        layout: "fullscreen"
    },
    decorators: [
        Story => (
            <TooltipProvider>
                <div className="w-[60%] h-32 mx-auto flex justify-center items-center">
                    <Story />
                </div>
            </TooltipProvider>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof RangeSlider>;

export const Default: Story = {};

export const WithMinAndMaxValues = {
    args: {
        min: 25,
        max: 75
    }
};

export const WithValues = {
    args: {
        value: [25, 75]
    }
};

export const WithSteps = {
    args: {
        step: 10
    }
};

export const Disabled = {
    args: {
        disabled: true
    }
};
