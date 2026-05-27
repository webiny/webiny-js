import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SwitchPrimitive } from "./SwitchPrimitive.js";

const meta: Meta<typeof SwitchPrimitive> = {
    title: "Components/Form Primitives/Switch",
    component: SwitchPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [checked, setChecked] = useState(args.checked);
        return (
            <SwitchPrimitive {...args} checked={checked} onChange={value => setChecked(value)} />
        );
    }
};

export default meta;
type Story = StoryObj<typeof SwitchPrimitive>;

export const Default: Story = {
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

export const WithLongLeadingLabel: Story = {
    args: {
        label: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu aliquam lacus. Morbi eleifend, eros et vestibulum lobortis, mi elit scelerisque neque, sit amet dictum orci sem ac ante. In hac habitasse platea dictumst. Pellentesque molestie nisl tortor, eu dictum velit mollis vitae. Maecenas nec risus sit amet ante efficitur venenatis id eget eros. Aenean mollis vel dolor vitae vestibulum. Integer consectetur id diam eget iaculis. Praesent egestas ullamcorper libero vel eleifend.",
        labelPosition: "start"
    }
};

export const WithTrailingLabel: Story = {
    args: {
        label: "Trailing label",
        labelPosition: "end"
    }
};

export const WithLongTrailingLabel: Story = {
    args: {
        label: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Praesent eu aliquam lacus. Morbi eleifend, eros et vestibulum lobortis, mi elit scelerisque neque, sit amet dictum orci sem ac ante. In hac habitasse platea dictumst. Pellentesque molestie nisl tortor, eu dictum velit mollis vitae. Maecenas nec risus sit amet ante efficitur venenatis id eget eros. Aenean mollis vel dolor vitae vestibulum. Integer consectetur id diam eget iaculis. Praesent egestas ullamcorper libero vel eleifend.",
        labelPosition: "end"
    }
};

export const Checked: Story = {
    args: {
        checked: true
    }
};

export const Disabled: Story = {
    args: {
        label: "Label",
        disabled: true
    }
};
