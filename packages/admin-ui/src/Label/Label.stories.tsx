import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "./Label";

const meta: Meta<typeof Label> = {
    title: "Components/Label",
    component: Label,
    tags: ["autodocs"]
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
