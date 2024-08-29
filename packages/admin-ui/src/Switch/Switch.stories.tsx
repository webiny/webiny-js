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

export const Default: Story = {
    args: {
        id: "switch-id"
    }
};

export const WithLabel: Story = {
    args: {
        id: "label-switch-id",
        label: "Label"
    }
};

export const WithLeadingLabel: Story = {
    args: {
        id: "leading-label-switch-id",
        label: "Leading label",
        labelPosition: "leading"
    }
};

export const WithTrailingLabel: Story = {
    args: {
        id: "trailing-label-switch-id",
        label: "Trailing label",
        labelPosition: "trailing"
    }
};
