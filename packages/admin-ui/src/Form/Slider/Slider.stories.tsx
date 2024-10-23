import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider";

const meta: Meta<typeof Slider> = {
    title: "Components/Form/Slider",
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

export const Default: Story = {
    args: {
        label: "Label"
    }
};

export const WithDefaultValue: Story = {
    args: {
        label: "Label",
        defaultValue: 50
    }
};

export const WithMinAndMaxValues = {
    args: {
        label: "Label",
        min: 10,
        max: 20
    }
};

export const WithSteps = {
    args: {
        label: "Label",
        step: 10
    }
};

export const Disabled = {
    args: {
        label: "Label",
        disabled: true,
        value: 50
    }
};

export const WithSideLabel = {
    args: {
        label: "Label",
        labelPosition: "side"
    }
};

export const WithCustomValueConverter = {
    args: {
        label: "Label",
        valueConverter: (value: number) => {
            return `${Math.round(value)}%`;
        }
    }
};
