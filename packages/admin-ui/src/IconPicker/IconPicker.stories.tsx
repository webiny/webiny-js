import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import { IconPicker } from "~/IconPicker/index.js";

const meta: Meta<typeof IconPicker> = {
    title: "Components/Form/IconPicker",
    component: IconPicker,
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
        return <IconPicker {...args} value={value} onChange={setValue} />;
    }
};

library.add(fas);

export default meta;
type Story = StoryObj<typeof IconPicker>;

export const Default: Story = {
    args: {
        icons: [
            { prefix: "fas", name: "trash-restore-alt" },
            { prefix: "fas", name: "trash-can-arrow-up" },
            { prefix: "fas", name: "naira-sign" },
            { prefix: "fas", name: "cart-arrow-down" },
            { prefix: "fas", name: "walkie-talkie" },
            { prefix: "fas", name: "file-edit" },
            { prefix: "fas", name: "file-pen" },
            { prefix: "fas", name: "receipt" },
            { prefix: "fas", name: "pen-square" },
            { prefix: "fas", name: "pencil-square" },
            { prefix: "fas", name: "square-pen" },
            { prefix: "fas", name: "suitcase-rolling" },
            { prefix: "fas", name: "person-circle-exclamation" },
            { prefix: "fas", name: "chevron-down" },
            { prefix: "fas", name: "battery" },
            { prefix: "fas", name: "battery-5" },
            { prefix: "fas", name: "battery-full" },
            { prefix: "fas", name: "skull-crossbones" },
            { prefix: "fas", name: "code-compare" },
            { prefix: "fas", name: "list-dots" },
            { prefix: "fas", name: "list-ul" },
            { prefix: "fas", name: "school-lock" },
            { prefix: "fas", name: "tower-cell" },
            { prefix: "fas", name: "long-arrow-alt-down" },
            { prefix: "fas", name: "down-long" },
            { prefix: "fas", name: "ranking-star" },
            { prefix: "fas", name: "chess-king" },
            { prefix: "fas", name: "person-harassing" },
            { prefix: "fas", name: "brazilian-real-sign" },
            { prefix: "fas", name: "landmark-alt" },
            { prefix: "fas", name: "landmark-dome" },
            { prefix: "fas", name: "arrow-up" },
            { prefix: "fas", name: "television" },
            { prefix: "fas", name: "tv-alt" },
            { prefix: "fas", name: "tv" },
            { prefix: "fas", name: "shrimp" },
            { prefix: "fas", name: "tasks" },
            { prefix: "fas", name: "list-check" },
            { prefix: "fas", name: "jug-detergent" },
            { prefix: "fas", name: "user-circle" },
            { prefix: "fas", name: "circle-user" },
            { prefix: "fas", name: "user-shield" },
            { prefix: "fas", name: "wind" },
            { prefix: "fas", name: "car-crash" },
            { prefix: "fas", name: "car-burst" },
            { prefix: "fas", name: "y" },
            { prefix: "fas", name: "snowboarding" },
            { prefix: "fas", name: "person-snowboarding" },
            { prefix: "fas", name: "shipping-fast" },
            { prefix: "fas", name: "truck-fast" }
        ]
    }
};

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
        const [value, setValue] = useState(args.value || null);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update value when args.value changes
        useEffect(() => {
            setValue(args.value || null);
        }, [args.value]);

        const handleChange = (newValue: any) => {
            setValue(newValue);

            // Simple required validation
            if (args.required && !newValue) {
                setValidation({ isValid: false, message: "Please select an icon" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && !value) {
                setValidation({ isValid: false, message: "Please select an icon" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, value]);

        return (
            <IconPicker
                {...args}
                value={value}
                onChange={handleChange}
                validation={validation}
                required={args.required}
            />
        );
    },
    args: {
        label: "Select an Icon",
        required: true,
        disabled: false,
        description: "Choose an icon for your button",
        note: "Note: The selected icon will be displayed on your button",
        icons: [
            { prefix: "fas", name: "trash-restore-alt" },
            { prefix: "fas", name: "file-pen" },
            { prefix: "fas", name: "receipt" },
            { prefix: "fas", name: "user-circle" },
            { prefix: "fas", name: "circle-user" }
        ],
        value: null,
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the icon picker",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the icon picker when set to true",
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
        icons: {
            description: "Array of available icons with prefix and name properties",
            control: "object"
        },
        value: {
            description: "The selected icon value (in format 'prefix/name')"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onChange: {
            description: "Function called when an icon is selected"
        }
    }
};
