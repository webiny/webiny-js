import type { Meta, StoryObj } from "@storybook/react";

import { Switch } from "./Switch";

const meta: Meta<typeof Switch> = {
    title: "Components/Switch",
    component: Switch,
    tags: ["autodocs"],
    argTypes: {
        // Note: after upgrading to Storybook 8.X, use `fn`from `@storybook/test` to spy on the onCheckedChange argument.
        onCheckedChange: { action: "onCheckedChange" }
    }
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
        labelPosition: "start"
    }
};

export const WithTrailingLabel: Story = {
    args: {
        label: "Trailing label",
        labelPosition: "end"
    }
};
