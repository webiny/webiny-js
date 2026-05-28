import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { AutoComplete } from "./AutoComplete.js";

const meta: Meta<typeof AutoComplete> = {
    title: "Components/Form/AutoComplete",
    component: AutoComplete,
    argTypes: {
        onValueChange: { action: "onValueChange" }
    },
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return <AutoComplete {...args} value={value} onValueChange={setValue} />;
    }
};

export default meta;
type Story = StoryObj<typeof AutoComplete>;

export const Default: Story = {
    args: {
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)",
            "Central European Time (CET)",
            "Central Africa Time (CAT)",
            "India Standard Time (IST)",
            "China Standard Time (CST)",
            "Japan Standard Time (JST)",
            "Australian Western Standard Time (AWST)",
            "New Zealand Standard Time (NZST)",
            "Fiji Time (FJT)",
            "Argentina Time (ART)",
            "Bolivia Time (BOT)",
            "Brasilia Time (BRT)"
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

export const OnValueChange: Story = {
    args: {
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)"
        ],
        label: "Time Zone",
        onValueChange: value => {
            console.log("User selected Time zone:", value);
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

        const handleValueChange = (newValue: string) => {
            setValue(newValue);

            // Simple required validation
            if (!newValue && args.required) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change
        useEffect(() => {
            if (args.required && !value) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, value]);

        return (
            <AutoComplete
                {...args}
                value={value}
                onValueChange={handleValueChange}
                validation={validation}
            />
        );
    },
    args: {
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)"
        ],
        label: "Time Zone",
        required: true,
        description: "Select your timezone from the list",
        placeholder: "Select timezone...",
        validation: {
            isValid: false,
            message: "This field is required."
        },
        onValueChange: undefined
    },
    argTypes: {
        options: {
            description:
                "AutoComplete Options - Please refer to the example code for details on usage."
        },
        label: {
            description: "Label text for the autocomplete field",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        description: {
            description: "Additional description text below the field",
            control: "text"
        },
        placeholder: {
            description: "Placeholder text shown when no value is selected",
            control: "text"
        },
        validation: {
            description: "Object containing validation state and message"
        },
        onValueChange: {
            description: "Function called when the selected value changes"
        }
    }
};
