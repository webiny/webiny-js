import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { MultiSelect } from "./MultiSelect.js";

const defaultOptions = [
    { label: "Option 1", value: "option-1" },
    { label: "Option 2", value: "option-2" },
    { label: "Option 3", value: "option-3" },
    { label: "Option 4", value: "option-4" },
    { label: "Option 5", value: "option-5" },
    { label: "Option 6", value: "option-6" }
];

const meta: Meta<typeof MultiSelect> = {
    title: "Components/Form/MultiSelect",
    component: MultiSelect,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState<string[]>(args.value ?? []);
        return <MultiSelect {...args} value={value} onChange={setValue} />;
    }
};

export default meta;
type Story = StoryObj<typeof MultiSelect>;

export const Default: Story = {
    args: {
        options: defaultOptions
    }
};

export const WithLabel: Story = {
    args: {
        ...Default.args,
        label: "Label"
    }
};

export const WithPreselected: Story = {
    args: {
        ...Default.args,
        label: "Label",
        value: ["option-1", "option-2", "option-3"]
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        label: "Label",
        description: "Select one or more options from the list."
    }
};

export const WithErrors: Story = {
    args: {
        ...Default.args,
        label: "Label",
        validation: {
            isValid: false,
            message: "At least one option must be selected."
        }
    }
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        label: "Label",
        disabled: true,
        value: ["option-1", "option-2"]
    }
};

export const FullExample: Story = {
    args: {
        label: "Label",
        description: "Select one or more options from the list.",
        note: "Note: Ensure your selection is accurate before proceeding.",
        required: true,
        options: defaultOptions,
        value: ["option-1", "option-2", "option-3"],
        validation: {
            isValid: false,
            message: "At least one option must be selected."
        }
    }
};
