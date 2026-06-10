import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RadioGroup } from "./RadioGroup.js";

const meta: Meta<typeof RadioGroup> = {
    title: "Components/Form/RadioGroup",
    component: RadioGroup,
    argTypes: {
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
        return <RadioGroup {...args} value={value} onChange={value => setValue(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
    args: {
        items: [
            {
                label: "Value 1",
                value: "value-1"
            },
            {
                label: "Value 2",
                value: "value-2"
            },
            {
                label: "Value 3",
                value: "value-3"
            }
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
        disabled: true,
        items: [
            {
                label: "Value 1",
                value: "value-1",
                disabled: true
            },
            {
                label: "Value 2",
                value: "value-2",
                disabled: true
            },
            {
                label: "Value 3",
                value: "value-3",
                disabled: true
            }
        ]
    }
};

export const FullExample: Story = {
    args: {
        ...Default.args,
        label: "Select which deploy option do you prefer",
        required: true,
        description:
            "Deployment option is simply a way of parsing the data based on your database settings.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "You must select at least one option!"
        }
    }
};

export const Documentation: Story = {
    render: args => {
        const [value, setValue] = useState("");
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        const handleValidation = () => {
            if (args.required && !value) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        return (
            <RadioGroup
                {...args}
                value={value}
                validation={validation}
                onChange={newValue => setValue(newValue)}
                onBlur={handleValidation}
            />
        );
    },
    args: {
        label: "Deployment Option",
        description: "Choose your preferred deployment method",
        note: "This setting will determine how your application is deployed",
        required: true,
        disabled: false,
        items: [
            {
                label: "Automatic Deployment",
                value: "automatic"
            },
            {
                label: "Manual Deployment",
                value: "manual"
            },
            {
                label: "Scheduled Deployment",
                value: "scheduled"
            }
        ]
    }
};
