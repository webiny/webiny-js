import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Checkbox } from "~/Checkbox/index.js";

const meta: Meta<typeof Checkbox> = {
    title: "Components/Form/Checkbox",
    component: Checkbox,
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
        const [checked, setChecked] = useState(args.checked);
        return <Checkbox {...args} checked={checked} onChange={checked => setChecked(checked)} />;
    }
};

export default meta;
type Story = StoryObj<typeof Checkbox>;

export const Default: Story = {
    args: {
        label: "Any field label"
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
        const [checked, setChecked] = useState(args.checked || false);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update checked state when args.checked changes
        useEffect(() => {
            setChecked(args.checked || false);
        }, [args.checked]);

        const handleChange = (isChecked: boolean) => {
            setChecked(isChecked);

            // Simple required validation
            if (args.required && !isChecked) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change
        useEffect(() => {
            if (args.required && !checked) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, checked]);

        return (
            <Checkbox {...args} checked={checked} onChange={handleChange} validation={validation} />
        );
    },
    args: {
        label: "Any field label",
        checked: false,
        disabled: false,
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your selection or input is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    },
    argTypes: {
        label: {
            description: "Label text for the checkbox",
            control: "text",
            defaultValue: "Any field label"
        },
        checked: {
            description: "Determines if the checkbox is checked",
            control: "boolean",
            defaultValue: false
        },
        disabled: {
            description: "Disables the checkbox when set to true",
            control: "boolean",
            defaultValue: false
        },
        required: {
            description: "Makes the checkbox required when set to true",
            control: "boolean",
            defaultValue: false
        },
        description: {
            description: "Additional description text below the checkbox",
            control: "text"
        },
        note: {
            description: "Additional note text below the checkbox",
            control: "text"
        },
        validation: {
            description: "Validation state and message",
            control: "object"
        },
        onChange: {
            description: "Callback function triggered when checkbox state changes"
        }
    }
};
