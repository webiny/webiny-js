import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";
import React from "react";

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

export const WithMinAndMaxValues = {
    args: {
        min: 10,
        max: 20
    }
};

export const WithDefaultValue = {
    args: {
        defaultValue: [50]
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
