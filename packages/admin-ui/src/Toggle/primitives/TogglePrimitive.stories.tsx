import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { TogglePrimitive } from "./TogglePrimitive.js";

const meta: Meta<typeof TogglePrimitive> = {
    title: "Components/Form Primitives/Toggle",
    component: TogglePrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [checked, setChecked] = useState(args.checked);
        return (
            <TogglePrimitive {...args} checked={checked} onChange={value => setChecked(value)} />
        );
    }
};

export default meta;
type Story = StoryObj<typeof TogglePrimitive>;

export const Default: Story = {
    args: {
        label: "Toggle"
    }
};

export const Checked: Story = {
    args: {
        label: "Toggle",
        checked: true
    }
};

export const Outline: Story = {
    args: {
        label: "Toggle",
        variant: "outline"
    }
};

export const OutlineChecked: Story = {
    args: {
        label: "Toggle",
        variant: "outline",
        checked: true
    }
};

export const Ghost: Story = {
    args: {
        label: "Toggle",
        variant: "ghost"
    }
};

export const GhostChecked: Story = {
    args: {
        label: "Toggle",
        variant: "ghost",
        checked: true
    }
};

export const SizeSmall: Story = {
    args: {
        label: "Toggle",
        size: "sm"
    }
};

export const SizeLarge: Story = {
    args: {
        label: "Toggle",
        size: "lg"
    }
};

export const SizeXL: Story = {
    args: {
        label: "Toggle",
        size: "xl"
    }
};

export const Disabled: Story = {
    args: {
        label: "Toggle",
        disabled: true
    }
};

export const DisabledChecked: Story = {
    args: {
        label: "Toggle",
        checked: true,
        disabled: true
    }
};
