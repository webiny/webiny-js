import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "./Label";
import { TooltipProvider } from "~/Tooltip";

const meta: Meta<typeof Label> = {
    title: "Components/Label",
    component: Label,
    tags: ["autodocs"],
    decorators: [
        Story => (
            <TooltipProvider>
                <div className="flex justify-center items-center h-48">
                    <Story />
                </div>
            </TooltipProvider>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Default: Story = {
    args: {
        text: "Test label",
        htmlFor: "test-field"
    },
    render: args => (
        <>
            <input type="checkbox" id={args.htmlFor} />
            <Label {...args} />
        </>
    )
};

export const LightWeight: Story = {
    args: {
        ...Default.args,
        weight: "light"
    }
};

export const Required: Story = {
    args: {
        ...Default.args,
        required: true
    }
};

export const Optional: Story = {
    args: {
        ...Default.args,
        optional: true
    }
};

export const WithInfo: Story = {
    args: {
        ...Default.args,
        info: "An informative text"
    }
};

export const WithValue: Story = {
    args: {
        ...Default.args,
        value: 24
    },
    render: args => (
        <div className="w-64">
            <Label {...args} />
        </div>
    )
};
