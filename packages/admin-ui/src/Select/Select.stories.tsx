import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Select } from "~/Select/index.js";

const meta: Meta<typeof Select> = {
    title: "Components/Form/Select",
    component: Select,
    argTypes: {
        onChange: { action: "onChange" },
        onOpenChange: { action: "onOpenChange" },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return <Select {...args} value={value} onChange={setValue} />;
    }
};

export default meta;
type Story = StoryObj<typeof Select>;

export const Default: Story = {
    args: {
        options: [
            { value: "EST", label: "Eastern Standard Time (UTC-5)" },
            { value: "CST", label: "Central Standard Time (UTC-6)" },
            { value: "PST", label: "Pacific Standard Time (UTC-8)" },
            { value: "GMT", label: "Greenwich Mean Time (UTC+0)" },
            { value: "CET", label: "Central European Time (UTC+1)" },
            { value: "CAT", label: "Central Africa Time (UTC+2)" },
            { value: "IST", label: "India Standard Time (UTC+5:30)" },
            { value: "CST_CHINA", label: "China Standard Time (UTC+8)" },
            { value: "JST", label: "Japan Standard Time (UTC+9)" },
            { value: "AWST", label: "Australian Western Standard Time (UTC+8)" },
            { value: "NZST", label: "New Zealand Standard Time (UTC+12)" },
            { value: "FJT", label: "Fiji Time (UTC+12)" },
            { value: "ART", label: "Argentina Time (UTC-3)" },
            { value: "BOT", label: "Bolivia Time (UTC-4)" },
            { value: "BRT", label: "Brasilia Time (UTC-3)" }
        ]
    }
};

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

export const Documentation: Story = {
    render: args => {
        const [value, setValue] = useState("");

        return <Select {...args} value={value} onChange={newValue => setValue(newValue)} />;
    },
    args: {
        label: "Time Zone",
        description: "Select your preferred time zone",
        note: "This setting will affect how times are displayed throughout the application",
        required: true,
        disabled: false,
        options: [
            { value: "EST", label: "Eastern Standard Time (UTC-5)" },
            { value: "CST", label: "Central Standard Time (UTC-6)" },
            { value: "PST", label: "Pacific Standard Time (UTC-8)" },
            { value: "GMT", label: "Greenwich Mean Time (UTC+0)" },
            { value: "CET", label: "Central European Time (UTC+1)" },
            { value: "IST", label: "India Standard Time (UTC+5:30)" }
        ]
    }
};
