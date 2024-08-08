import type { Meta, StoryObj } from "@storybook/react";

import { Input } from "./Input";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Input> = {
    title: "Components/Input",
    component: Input,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"],
    // More on argTypes: https://storybook.js.org/docs/api/argtypes
    argTypes: {},
    // Use `fn` to spy on the onClick arg, which will appear in the actions panel once invoked: https://storybook.js.org/docs/essentials/actions#action-args
    args: {}
};

export default meta;
type Story = StoryObj<typeof Input>;

// More on writing stories with args: https://storybook.js.org/docs/writing-stories/args
export const Text: Story = {
    args: {
        type: "text",
        placeholder: "Text"
    }
};

export const Number: Story = {
    args: {
        type: "number",
        placeholder: "Number"
    }
};

export const Email: Story = {
    args: {
        type: "email",
        placeholder: "Email"
    }
};

export const File: Story = {
    args: {
        type: "file",
        placeholder: "File"
    }
};

export const Disabled: Story = {
    args: {
        type: "text",
        placeholder: "Disabled",
        disabled: true
    }
};
