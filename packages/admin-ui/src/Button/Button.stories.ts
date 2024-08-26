import type { Meta, StoryObj } from "@storybook/react";
import { fn } from "@storybook/test";

import { Button } from "./Button";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Button> = {
    title: "Components/Button",
    component: Button,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {
        variant: { control: "select", options: ["primary", "secondary", "outline", "ghost"] },
        size: { control: "select", options: ["sm", "md", "lg", "xl"] }
    },
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: { onClick: fn() }
};

export default meta;
type Story = StoryObj<typeof Button>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Primary: Story = {
    args: {
        variant: "primary",
        children: "Button"
    }
};

export const Secondary: Story = {
    args: {
        ...Primary.args,
        variant: "secondary"
    }
};

export const Outline: Story = {
    args: {
        ...Primary.args,
        variant: "outline"
    }
};

export const Ghost: Story = {
    args: {
        ...Primary.args,
        variant: "ghost"
    }
};

export const Small: Story = {
    args: {
        ...Primary.args,
        size: "sm"
    }
};

export const Medium: Story = {
    args: {
        ...Primary.args,
        size: "md"
    }
};

export const Large: Story = {
    args: {
        ...Primary.args,
        size: "lg"
    }
};

export const ExtraLarge: Story = {
    args: {
        ...Primary.args,
        size: "xl"
    }
};
