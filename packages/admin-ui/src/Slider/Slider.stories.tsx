import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
    title: "Components/Slider",
    component: Slider,
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
            <div className="w-[60%] h-32 mx-auto flex justify-center items-center">
                <Story />
            </div>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof Slider>;

export const Default: Story = {};

export const WithMinAndMaxValues: Story = {
    args: {
        min: 10,
        max: 20
    }
};

export const WithNegativeMinValue: Story = {
    args: {
        min: -100,
        max: 100,
        defaultValue: 0
    }
};

export const WithDefaultValue: Story = {
    args: {
        defaultValue: 50
    }
};

export const WithSteps: Story = {
    args: {
        step: 10
    }
};

export const Disabled: Story = {
    args: {
        disabled: true,
        value: 50
    }
};

export const WithTooltip: Story = {
    args: {
        showTooltip: true
    }
};

export const WithTooltipSideTop: Story = {
    args: {
        showTooltip: true,
        tooltipSide: "top"
    }
};

export const WithTooltipAndCustomValueTransformer: Story = {
    args: {
        showTooltip: true,
        transformValue: (value: number) => {
            return `${Math.round(value)}%`;
        }
    }
};
