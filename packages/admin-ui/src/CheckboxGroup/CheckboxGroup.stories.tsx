import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CheckboxGroup } from "~/CheckboxGroup/index.js";

const meta: Meta<typeof CheckboxGroup> = {
    title: "Components/Form/CheckboxGroup",
    component: CheckboxGroup,
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
        return <CheckboxGroup {...args} value={value} onChange={value => setValue(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof CheckboxGroup>;

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
        ],
        value: []
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
        ],
        disabled: true
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
            message: "You must select at least one of the items!"
        }
    }
};

export const Documentation: Story = {
    render: args => {
        const [selectedValues, setSelectedValues] = useState<string[]>(args.value || []);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update values when args.value changes
        useEffect(() => {
            setSelectedValues(args.value || []);
        }, [args.value]);

        const handleChange = (newValues: string[]) => {
            setSelectedValues(newValues);

            // Simple required validation
            if (args.required && (!newValues || newValues.length === 0)) {
                setValidation({ isValid: false, message: "Please select at least one option." });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && (!selectedValues || selectedValues.length === 0)) {
                setValidation({ isValid: false, message: "Please select at least one option." });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, selectedValues]);

        return (
            <CheckboxGroup
                {...args}
                value={selectedValues}
                onChange={handleChange}
                validation={validation}
                required={args.required}
            />
        );
    },
    args: {
        label: "Select your preferences",
        required: true,
        disabled: false,
        description: "Choose one or more options.",
        note: "Note: You can select multiple values.",
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
        ],
        value: [],
        validation: {
            isValid: false,
            message: "Please select at least one option."
        }
    },
    argTypes: {
        label: {
            description: "Label text for the checkbox group",
            control: "text",
            defaultValue: "Select your preferences"
        },
        required: {
            description: "Makes the checkbox group required when set to true",
            control: "boolean",
            defaultValue: true
        },
        disabled: {
            description: "Disables the checkbox group when set to true",
            control: "boolean",
            defaultValue: false
        },
        description: {
            description: "Additional description text below the checkbox group",
            control: "text"
        },
        note: {
            description: "Additional note text below the checkbox group",
            control: "text"
        },
        validation: {
            description: "Validation state and message",
            control: "object"
        },
        items: {
            description: "Array of checkbox items with label and value",
            control: "object"
        },
        value: {
            description: "Array of selected values",
            control: "object"
        },
        onChange: {
            description: "Callback function triggered when selection changes"
        }
    }
};
