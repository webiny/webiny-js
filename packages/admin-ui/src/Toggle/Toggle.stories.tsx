import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Tooltip } from "~/Tooltip/index.js";
import { Toggle } from "~/Toggle/index.js";

const meta: Meta<typeof Toggle> = {
    title: "Components/Form/Toggle",
    component: Toggle,
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
        return <Toggle {...args} checked={checked} onChange={value => setChecked(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof Toggle>;

export const Default: Story = {
    args: {
        label: "Toggle"
    }
};

export const Checked: Story = {
    args: {
        label: "Toggle",
        checked: true
    }
};

export const Outline: Story = {
    args: {
        label: "Toggle",
        variant: "outline"
    }
};

export const Ghost: Story = {
    args: {
        label: "Toggle",
        variant: "ghost"
    }
};

export const WithNotes: Story = {
    args: {
        label: "Toggle",
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const WithErrors: Story = {
    args: {
        label: "Toggle",
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const Disabled: Story = {
    args: {
        label: "Toggle",
        disabled: true
    }
};

export const Documentation: Story = {
    render: args => {
        const [checked, setChecked] = useState(args.checked || false);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        useEffect(() => {
            setChecked(args.checked || false);
        }, [args.checked]);

        const handleChange = (isChecked: boolean) => {
            setChecked(isChecked);

            if (args.required && !isChecked) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        useEffect(() => {
            if (args.required && !checked) {
                setValidation({ isValid: false, message: "This field is required" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, checked]);

        return (
            <Toggle
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
        note: "Note: This setting can be changed at any time.",
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text displayed inside the toggle button",
            control: "text"
        },
        checked: {
            description: "Determines if the toggle is active",
            control: "boolean"
        },
        disabled: {
            description: "Disables the toggle when set to true",
            control: "boolean"
        },
        required: {
            description: "Makes the toggle required when set to true",
            control: "boolean"
        },
        variant: {
            description: "Visual style: primary (default), outline, ghost, ghost-negative",
            control: "select",
            options: ["primary", "outline", "ghost", "ghost-negative"]
        },
        size: {
            description: "Size of the toggle button",
            control: "select",
            options: ["sm", "md", "lg", "xl"]
        },
        note: {
            description: "Additional note text below the toggle",
            control: "text"
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onChange: {
            description: "Function called when the toggle state changes"
        }
    }
};
