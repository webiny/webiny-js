import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxPrimitive } from "./CheckboxPrimitive.js";

const meta: Meta<typeof CheckboxPrimitive> = {
    title: "Components/Form Primitives/Checkbox",
    component: CheckboxPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [checked, setChecked] = useState(args.checked);
        return (
            <CheckboxPrimitive
                {...args}
                checked={checked}
                onChange={checked => setChecked(checked)}
            />
        );
    }
};

export default meta;
type Story = StoryObj<typeof CheckboxPrimitive>;

export const Default: Story = {
    args: {
        label: "Any field label"
    }
};

export const LongLabel: Story = {
    args: {
        label: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu aliquam lacus. Morbi eleifend, eros et vestibulum lobortis, mi elit scelerisque neque, sit amet dictum orci sem ac ante. In hac habitasse platea dictumst. Pellentesque molestie nisl tortor, eu dictum velit mollis vitae. Maecenas nec risus sit amet ante efficitur venenatis id eget eros. Aenean mollis vel dolor vitae vestibulum. Integer consectetur id diam eget iaculis. Praesent egestas ullamcorper libero vel eleifend. "
    }
};

export const Checked: Story = {
    args: {
        ...Default.args,
        checked: true
    }
};

export const Indeterminate: Story = {
    args: {
        ...Default.args,
        indeterminate: true
    }
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        disabled: true
    }
};
