import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Switch } from "~/Switch/index.js";
import { Tooltip } from "~/Tooltip/index.js";

const meta: Meta<typeof Switch> = {
    title: "Components/Form/Switch",
    component: Switch,
    parameters: {
        layout: "padded"
    },
    argTypes: {
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    decorators: [
        Story => (
            <Tooltip.Provider>
                <Story />
            </Tooltip.Provider>
        )
    ],
    render: args => {
        const [checked, setChecked] = useState(args.checked);
        return <Switch {...args} checked={checked} onChange={value => setChecked(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof Switch>;

export const Default: Story = {
    args: {
        label: "Any field label"
    }
};

export const WithLabelRequired: Story = {
    args: {
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
            <Switch
                {...args}
                checked={checked}
                onChange={handleChange}
                validation={validation}
                required={args.required}
            />
        );
    },
    args: {
        label: "Enable feature",
        checked: false,
        disabled: false,
        required: true,
        description: "Enabling this feature will activate additional functionality.",
        note: "Note: This setting can be changed at any time.",
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the switch",
            control: "text"
        },
        checked: {
            description: "Determines if the switch is checked",
            control: "boolean"
        },
        disabled: {
            description: "Disables the switch when set to true",
            control: "boolean"
        },
        required: {
            description: "Makes the switch required when set to true",
            control: "boolean"
        },
        description: {
            description: "Additional description text below the switch",
            control: "text"
        },
        note: {
            description: "Additional note text below the switch",
            control: "text"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onChange: {
            description: "Function called when the switch state changes"
        }
    }
};
