import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { CodeEditor } from "./CodeEditor";

const meta: Meta<typeof CodeEditor> = {
    title: "Components/Form/CodeEditor",
    component: CodeEditor,
    argTypes: {
        onChange: { action: "onChange" },
        disabled: {
            control: "boolean",
            defaultValue: false
        }
    },
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof CodeEditor>;

export const Default: Story = {};

export const WithLabel: Story = {
    args: {
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

        const handleChange = (newValue: string | undefined) => {
            setValue(newValue);

            // Simple required validation
            if (args.required && (!newValue || newValue.trim() === "")) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && (!value || value.trim() === "")) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, value]);

        return (
            <CodeEditor
                {...args}
                value={value}
                onChange={handleChange}
                validation={validation}
                required={args.required}
            />
        );
    },
    args: {
        label: "JSON Configuration",
        required: true,
        disabled: false,
        description: "Enter your configuration in JSON format",
        note: "Note: Make sure your JSON is valid",
        theme: "github",
        value: '{\n  "name": "example",\n  "version": "1.0.0"\n}',
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the code editor",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the code editor when set to true",
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
        theme: {
            description: "The theme for the code editor",
            control: "select",
            options: ["github", "twilight", "chrome"]
        },
        value: {
            description: "The code content",
            control: "text"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage.",
            control: "none"
        },
        onChange: {
            description: "Function called when the code changes",
            control: "none"
        }
    }
};
