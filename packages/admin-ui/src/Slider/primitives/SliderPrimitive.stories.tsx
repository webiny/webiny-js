import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { SliderPrimitive } from "./SliderPrimitive.js";
import { Button } from "~/Button/index.js";

const meta: Meta<typeof SliderPrimitive> = {
    title: "Components/Form Primitives/Slider",
    component: SliderPrimitive,
    argTypes: {
        onValueChange: { action: "onValueChange" },
        onValueCommit: { action: "onValueCommit" }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return <SliderPrimitive {...args} value={value} onValueChange={value => setValue(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof SliderPrimitive>;

export const Default: Story = {};

export const WithDefaultValue: Story = {
    args: {
        value: 50
    }
};

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
        value: 0
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

export const WithExternalValueControl: Story = {
    args: {
        showTooltip: true,
        transformValue: (value: number) => {
            return `${Math.round(value)}%`;
        }
    },
    render: args => {
        const defaultValue = 50;
        const [value, setValue] = useState(defaultValue);
        return (
            <div className={"w-full"}>
                <div>
                    <SliderPrimitive
                        {...args}
                        value={value}
                        onValueChange={value => setValue(value)}
                    />
                </div>
                <div className={"mt-4 text-center"}>
                    <Button text={"Reset"} onClick={() => setValue(defaultValue)} />
                </div>
                <div className={"mt-4 text-center"}>
                    Current value: <code>{value}</code>
                </div>
            </div>
        );
    }
};
