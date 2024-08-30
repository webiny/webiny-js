import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
    title: "Components/Switch",
    component: Switch,
    tags: ["autodocs"],
    args: { onCheckedChange: fn() }
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: {
        label: "Label"
    }
};

export const WithLeadingLabel: Story = {
    args: {
        label: "Leading label",
        labelPosition: "leading"
    }
};

export const WithTrailingLabel: Story = {
    args: {
        label: "Trailing label",
        labelPosition: "trailing"
    }
};
