import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Textarea } from "~/Textarea";

const meta: Meta<typeof Textarea> = {
    title: "Components/Form/Textarea",
    component: Textarea,
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
type Story = StoryObj<typeof Textarea>;

export const Documentation: Story = {
    render: args => {
        const [value, setValue] = useState("");

        return <Textarea {...args} value={value} onChange={newValue => setValue(newValue)} />;
    },
    args: {
        label: "Message",
        description: "Enter your feedback or message",
        note: "Please be specific and provide relevant details",
        placeholder: "Type your message here...",
        required: true,
        disabled: false,
        onChange: undefined,
        validation: {
            isValid: true,
            message: ""
        },
        value: "",
        validate: undefined
    },
    argTypes: {
        size: {
            description: "Textarea field size",
            control: "select",
            options: ["md", "lg", "xl"],
            defaultValue: "lg"
        },
        variant: {
            description: "Textarea field style variant",
            control: "select",
            options: ["primary", "secondary", "ghost", "ghost-negative"],
            defaultValue: "primary"
        },
        label: {
            description: "Label text for the textarea",
            control: "text"
        },
        description: {
            description: "Additional description text below the textarea",
            control: "text"
        },
        note: {
            description: "Additional note text below the textarea",
            control: "text"
        },
        placeholder: {
            description: "Placeholder text shown when the textarea is empty",
            control: "text"
        },
        required: {
            description: "Makes the textarea required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the textarea when set to true",
            control: "boolean"
        },
        validation: {
            description: "Object containing validation state and message",
            control: "object"
        },
        value: {
            description: "The current value of the textarea",
            control: "text"
        },
        onChange: {
            description: "Function called when the textarea value changes",
            control: "none"
        },
        validate: {
            description:
                "Custom validation function, please refer to **With Validate Function** section below.",
            control: "none"
        }
    }
};

export const Default: Story = {};

export const WithLabel: Story = {
    args: {
        label: "Message"
    }
};

export const WithLabelRequired: Story = {
    args: {
        ...Default.args,
        label: "Message",
        required: true
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        description: "Enter your feedback or message in detail"
    }
};

export const WithNotes: Story = {
    args: {
        ...Default.args,
        note: "All messages are reviewed within 24 hours"
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
        label: "Message",
        disabled: true
    }
};

export const WithValidateFunction: Story = {
    render: args => {
        const [value, setValue] = useState("");
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        const validate = async () => {
            if (!value.trim()) {
                setValidation({ isValid: false, message: "This field is required" });
            } else if (value.length < 10) {
                setValidation({
                    isValid: false,
                    message: "Message must be at least 10 characters long"
                });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        return (
            <Textarea
                {...args}
                value={value}
                onChange={newValue => setValue(newValue)}
                validate={validate}
                validation={validation}
            />
        );
    },
    args: {
        ...Default.args,
        label: "Message",
        required: true,
        description: "Enter a message (minimum 10 characters)"
    }
};

export const FullExample: Story = {
    args: {
        ...Default.args,
        label: "Message",
        required: true,
        description: "Provide the required information for processing your request.",
        note: "Note: Ensure your message is accurate before proceeding.",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};
