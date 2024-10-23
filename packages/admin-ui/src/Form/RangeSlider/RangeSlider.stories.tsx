import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RangeSlider } from "./RangeSlider";

const meta: Meta<typeof RangeSlider> = {
    title: "Components/Form/RangeSlider",
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
            <div className="w-[60%] h-32 mx-auto flex justify-center items-center">
                <Story />
            </div>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof RangeSlider>;

export const Default: Story = {
    args: {
        label: "Label"
    }
};

export const WithMinAndMaxValues = {
    args: {
        label: "Label",
        min: 25,
        max: 75
    }
};

export const WithDefaultValues = {
    args: {
        label: "Label",
        defaultValue: [25, 75]
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
        disabled: true
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

export const WithExternalValueControl: Story = {
    args: {
        label: "Label"
    },
    render: args => {
        const [value, setValue] = useState([0, 100]);
        return (
            <div className={"w-full"}>
                <div>
                    <RangeSlider {...args} value={value} onValueChange={value => setValue(value)} />
                </div>
                <div className={"mt-4 text-center"}>
                    <button onClick={() => setValue([0, 100])}>{"Reset"}</button>
                </div>
            </div>
        );
    }
};
