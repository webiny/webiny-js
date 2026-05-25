import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Slider } from "./Slider.js";

const meta: Meta<typeof Slider> = {
    title: "Components/Form/Slider",
    component: Slider,
    argTypes: {
        onValueChange: { action: "onValueChange" },
        onValueCommit: { action: "onValueCommit" },
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
        return <Slider {...args} value={value} onValueChange={value => setValue(value)} />;
    }
};

export default meta;
type Story = StoryObj<typeof Slider>;

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

export const WithSideLabel: Story = {
    args: {
        ...Default.args,
        label: "Any field label",
        labelPosition: "side"
    }
};

export const WithSideLabelRequired: Story = {
    args: {
        ...WithSideLabel.args,
        required: true
    }
};

export const WithSideLabelAndDescription: Story = {
    args: {
        ...WithSideLabel.args,
        description: "Provide the required information for processing your request."
    }
};

export const WithSideLabelAndNotes: Story = {
    args: {
        ...WithSideLabel.args,
        note: "Note: Ensure your selection or input is accurate before proceeding."
    }
};

export const WithSideLabelAndErrors: Story = {
    args: {
        ...WithSideLabel.args,
        validation: {
            isValid: false,
            message: "This field is required."
        }
    }
};

export const WithSideLabelDisabled: Story = {
    args: {
        ...WithSideLabel.args,
        label: "Any field label",
        disabled: true
    }
};

export const WithSideLabelFullExample: Story = {
    args: {
        ...WithSideLabel.args,
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
        const [value, setValue] = useState(args.value || 50);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update value when args.value changes
        useEffect(() => {
            setValue(args.value ?? 50);
        }, [args.value]);

        const handleChange = (newValue: number) => {
            setValue(newValue);

            if (args.required && newValue === 0) {
                setValidation({ isValid: false, message: "Please select a value" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or value change
        useEffect(() => {
            if (args.required && value === 0) {
                setValidation({ isValid: false, message: "Please select a value" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, value]);

        return (
            <Slider
                {...args}
                value={value}
                onValueChange={handleChange}
                validation={validation}
                required={args.required}
                showTooltip={args.showTooltip}
                transformValue={args.transformValue}
            />
        );
    },
    args: {
        label: "Volume Level",
        required: true,
        disabled: false,
        description: "Adjust the volume level of your device",
        note: "Note: Higher values may cause distortion on some devices",
        min: 0,
        max: 100,
        step: 1,
        value: 50,
        showTooltip: true,
        transformValue: (value: number) => `${value}%`,
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the slider",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the slider when set to true",
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
        min: {
            description: "Minimum value for the slider",
            control: "number"
        },
        max: {
            description: "Maximum value for the slider",
            control: "number"
        },
        step: {
            description: "Step increment for the slider",
            control: "number"
        },
        value: {
            description: "Current value of the slider",
            control: "number"
        },
        showTooltip: {
            description: "Whether to show a tooltip with the current value",
            control: "boolean",
            defaultValue: true
        },
        transformValue: {
            description: "Function to transform the numeric value to display text"
        },
        labelPosition: {
            description: "Position of the label relative to the slider",
            control: "radio",
            options: ["top", "side"]
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onValueChange: {
            description: "Function called when the slider value changes"
        },
        onValueCommit: {
            description: "Function called when the slider value is committed (on release)"
        }
    }
};
