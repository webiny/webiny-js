import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { MultiAutoComplete } from "./MultiAutoComplete.js";

const meta: Meta<typeof MultiAutoComplete> = {
    title: "Components/Form/Multi AutoComplete",
    component: MultiAutoComplete,
    argTypes: {
        onValuesChange: { action: "onValuesChange" },
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
        const [values, setValues] = useState(args.values);
        return <MultiAutoComplete {...args} values={values} onValuesChange={setValues} />;
    }
};

export default meta;
type Story = StoryObj<typeof MultiAutoComplete>;

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

export const Documentation: Story = {
    render: args => {
        const [values, setValues] = useState(args.values || []);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update validation when values change
        useEffect(() => {
            if (args.required && (!values || values.length === 0)) {
                setValidation({ isValid: false, message: "Please select at least one option" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [values, args.required]);

        return (
            <MultiAutoComplete
                {...args}
                values={values}
                onValuesChange={setValues}
                validation={validation}
            />
        );
    },
    args: {
        label: "Time Zones",
        description: "Select one or more time zones",
        placeholder: "Search or select time zones",
        required: true,
        allowFreeInput: true,
        note: "You can add custom time zones if needed",
        options: [
            "Eastern Standard Time (EST)",
            "Central Standard Time (CST)",
            "Pacific Standard Time (PST)",
            "Greenwich Mean Time (GMT)"
        ],
        values: [],
        onValuesChange: undefined,
        disabled: false,
        validation: undefined,
        onOpenChange: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the component",
            control: "text"
        },
        description: {
            description: "Additional description text displayed below the label",
            control: "text"
        },
        placeholder: {
            description: "Placeholder text for the input",
            control: "text"
        },
        required: {
            description: "Marks the field as required when true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the component when set to true",
            control: "boolean"
        },
        allowFreeInput: {
            description: "Allows users to add custom values not in the options list",
            control: "boolean"
        },
        note: {
            description: "Additional note text displayed below the component",
            control: "text"
        },
        options: {
            description: "Array of options to display in the dropdown",
            control: "object"
        },
        values: {
            description: "Array of currently selected values",
            control: "object"
        },
        onValuesChange: {
            description: "Callback fired when selected values change"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onOpenChange: {
            description:
                "Callback triggered when the dropdown opens or closes, allowing you to respond to changes in its open state."
        }
    }
};
