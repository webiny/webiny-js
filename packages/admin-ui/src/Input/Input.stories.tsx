import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Input } from "~/Input";

const meta: Meta<typeof Input> = {
    title: "Components/Form/Input",
    component: Input,
    argTypes: {
        onChange: { action: "onChange" },
        type: {
            control: "select",
            options: [
                "text",
                "number",
                "email",
                "password",
                "tel",
                "url",
                "search",
                "date",
                "datetime-local",
                "month",
                "week",
                "time",
                "color",
                "file",
                "checkbox",
                "radio",
                "range",
                "hidden",
                "button",
                "submit",
                "reset",
                "image"
            ],
            defaultValue: "text"
        },
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
type Story = StoryObj<typeof Input>;

export const Default: Story = {};

export const WithLabel: Story = {
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
        description: "Provide the required information for processing your request."
    }
};

export const WithNotes: Story = {
    args: {
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const WithErrors: Story = {
    args: {
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Disabled: Story = {
    args: {
        label: "Any field label",
        disabled: true
    }
};

export const WithValidateFunction: Story = {
    render: args => {
        const [value, setValue] = useState("");
        const [validation, setValidation] = useState<any>({ isValid: true, message: undefined });

        const validate = async () => {
            // Simulate API call delay
            await new Promise(resolve => setTimeout(resolve, 500));

            // Example validation: check if email already exists
            if (value.includes("exists@")) {
                setValidation({ isValid: false, message: "This email is already registered" });
            } else {
                setValidation({ isValid: true, message: undefined });
            }
        };

        return (
            <Input
                {...args}
                type="email"
                label="Email"
                placeholder="Enter your email"
                value={value}
                onChange={newValue => setValue(newValue)}
                validate={validate}
                validation={validation}
            />
        );
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
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        const handleValidation = () => {
            if (args.required && !value.trim()) {
                setValidation({ isValid: false, message: "This field is required" });
            } else if (args.minLength && value.trim().length < args.minLength) {
                setValidation({
                    isValid: false,
                    message: `Must be at least ${args.minLength} characters long`
                });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        return (
            <Input
                {...args}
                value={value}
                onChange={newValue => setValue(newValue)}
                validation={validation}
                onBlur={handleValidation}
                onEnter={handleValidation}
            />
        );
    },
    args: {
        type: "text",
        size: "lg",
        variant: "primary",
        label: "Full Name",
        description: "Enter your full name as it appears on your ID",
        note: "This will be used for official documentation",
        placeholder: "Enter your full name",
        required: true,
        disabled: false,
        startIcon: undefined,
        endIcon: undefined,
        minLength: 3,
        maxLength: undefined,
        onChange: undefined,
        onBlur: undefined,
        onEnter: undefined,
        validation: undefined,
        validate: undefined
    },
    argTypes: {
        type: {
            description: "HTML input type attribute",
            control: "select",
            options: [
                "text",
                "number",
                "email",
                "password",
                "tel",
                "url",
                "search",
                "date",
                "datetime-local",
                "month",
                "week",
                "time",
                "color",
                "file"
            ],
            defaultValue: "text"
        },
        size: {
            description: "Input field size",
            control: "select",
            options: ["md", "lg", "xl"],
            defaultValue: "lg"
        },
        variant: {
            description: "Input field style variant",
            control: "select",
            options: ["primary", "secondary", "ghost", "ghost-negative"],
            defaultValue: "primary"
        },
        label: {
            description: "Label text displayed above the input",
            control: "text"
        },
        description: {
            description: "Helper text displayed below the label",
            control: "text"
        },
        note: {
            description: "Additional note displayed below the input",
            control: "text"
        },
        placeholder: {
            description: "Placeholder text shown when input is empty",
            control: "text"
        },
        required: {
            description: "Makes the input field required",
            control: "boolean",
            defaultValue: true
        },
        disabled: {
            description: "Disables the input field",
            control: "boolean",
            defaultValue: false
        },
        startIcon: {
            description: "Icon displayed at the start of the input",
            control: "none"
        },
        endIcon: {
            description: "Icon displayed at the end of the input",
            control: "none"
        },
        minLength: {
            description: "Minimum number of characters required",
            control: "number",
            defaultValue: 3
        },
        maxLength: {
            description:
                "Maximum number of characters allowed. To apply this maxLength, update the code similarly to how it's done for minLength. Refer to the minLength example above for guidance.",
            control: "number"
        },
        validation: {
            description:
                "Validation state and error message. Please refer to the example code for details on usage.",
            control: "none"
        },
        validate: {
            description: "Custom validation function",
            control: "none"
        },
        onChange: {
            description: "Callback function when input value changes",
            control: "none"
        },
        onBlur: {
            description: "Callback function when input loses focus",
            control: "none"
        },
        onEnter: {
            description: "Callback function when Enter key is pressed",
            control: "none"
        }
    } // Removed forwardEventOnChange and inputRef
};
