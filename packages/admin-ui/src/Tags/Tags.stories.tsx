import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Tags } from "./Tags";

const meta: Meta<typeof Tags> = {
    title: "Components/Form/Tags",
    component: Tags,
    argTypes: {
        onChange: { action: "onChange" },
        onValueInput: { action: "onValueInput" },
        onValueAdd: { action: "onValueAdd" },
        onValueRemove: { action: "onValueRemove" },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [values, setValues] = useState(args.value);
        return <Tags {...args} value={values} onChange={setValues} />;
    }
};

export default meta;
type Story = StoryObj<typeof Tags>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: {
        ...Default.args,
        label: "Any field label"
    }
};

export const WithRequiredLabel: Story = {
    args: {
        ...Default.args,
        label: "Any field label",
        required: true
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        description: "Provide the required information for processing your request."
    }
};

export const WithNotes: Story = {
    args: {
        ...Default.args,
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const WithErrors: Story = {
    args: {
        ...Default.args,
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Disabled: Story = {
    args: {
        ...Default.args,
        label: "Any field label",
        disabled: true
    }
};

export const FullExample: Story = {
    args: {
        ...Default.args,
        label: "Any field label",
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};
