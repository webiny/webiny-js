import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ColorPicker } from "./ColorPicker.js";

const meta: Meta<typeof ColorPicker> = {
    title: "Components/Form/ColorPicker",
    component: ColorPicker,
    argTypes: {
        onChange: { action: "onChange" },
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
        return <ColorPicker {...args} value={value} onChange={setValue} />;
    }
};

export default meta;
type Story = StoryObj<typeof ColorPicker>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: {
        ...Default.args,
        label: "Any field label"
    }
};

export const WithLabelRequired: Story = {
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
        const [value, setValue] = useState(args.value || "");
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update value when args.value changes
        useEffect(() => {
            setValue(args.value || "");
        }, [args.value]);

        const handleChange = (newValue: string) => {
            setValue(newValue);

            // Simple required validation
            if (args.required && (!newValue || newValue.trim() === "")) {
                setValidation({ isValid: false, message: "Please select a color" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && (!value || value.trim() === "")) {
                setValidation({ isValid: false, message: "Please select a color" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, value]);

        return (
            <ColorPicker
                {...args}
                value={value}
                onChange={handleChange}
                validation={validation}
                required={args.required}
            />
        );
    },
    args: {
        label: "Brand Color",
        required: true,
        disabled: false,
        description: "Select your primary brand color",
        note: "Note: Choose a color that aligns with your brand identity",
        value: "#4285F4",
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the color picker",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the color picker when set to true",
            control: "boolean"
        },
        description: {
            description: "Additional description text below the field",
            control: "text"
        },
        note: {
            description: "Additional note text below the field",
            control: "text"
        },
        value: {
            description: "The selected color value (hex, RGB, or named color)",
            control: "color"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onChange: {
            description: "Function called when the color changes"
        }
    }
};
