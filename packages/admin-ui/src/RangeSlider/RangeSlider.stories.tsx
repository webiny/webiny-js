import React, { useState, useEffect } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { RangeSlider } from "./RangeSlider.js";

const meta: Meta<typeof RangeSlider> = {
    title: "Components/Form/RangeSlider",
    component: RangeSlider,
    argTypes: {
        onValuesChange: { action: "onValuesChange" },
        onValuesCommit: { action: "onValuesCommit" },
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
        return (
            <RangeSlider {...args} values={values} onValuesChange={values => setValues(values)} />
        );
    }
};

export default meta;
type Story = StoryObj<typeof RangeSlider>;

export const Default: Story = {
    args: {
        label: "Any field label"
    }
};

export const WithLabelRequired: Story = {
    args: {
        ...Default.args,
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
        const [values, setValues] = useState(args.values || [25, 75]);
        const [validation, setValidation] = useState({ isValid: true, message: "" });

        // Update values when args.values changes
        useEffect(() => {
            setValues(args.values || [25, 75]);
        }, [args.values]);

        const handleChange = (newValues: number[]) => {
            setValues(newValues);

            if (args.required && newValues[0] === 0 && newValues[1] === 0) {
                setValidation({ isValid: false, message: "Please select a range" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        };

        // Validate on required change or values change
        useEffect(() => {
            if (args.required && values[0] === 0 && values[1] === 0) {
                setValidation({ isValid: false, message: "Please select a range" });
            } else {
                setValidation({ isValid: true, message: "" });
            }
        }, [args.required, values]);

        return (
            <RangeSlider
                {...args}
                values={values}
                onValuesChange={handleChange}
                validation={validation}
                required={args.required}
                showTooltip={args.showTooltip}
                transformValue={args.transformValue}
            />
        );
    },
    args: {
        label: "Price Range",
        required: true,
        disabled: false,
        description: "Select the minimum and maximum price range",
        note: "Note: The selected range will filter available products",
        min: 0,
        max: 100,
        step: 1,
        values: [25, 75],
        showTooltip: true,
        transformValue: (value: number) => `$${value}`,
        validation: undefined
    },
    argTypes: {
        label: {
            description: "Label text for the range slider",
            control: "text"
        },
        required: {
            description: "Makes the field required when set to true",
            control: "boolean"
        },
        disabled: {
            description: "Disables the range slider when set to true",
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
            description: "Minimum value for the range slider",
            control: "number"
        },
        max: {
            description: "Maximum value for the range slider",
            control: "number"
        },
        step: {
            description: "Step increment for the range slider",
            control: "number"
        },
        values: {
            description: "Current values of the range slider [min, max]",
            control: "object"
        },
        showTooltip: {
            description: "Whether to show tooltips with the current values",
            control: "boolean",
            defaultValue: true
        },
        transformValue: {
            description:
                "Function to transform the numeric values to display text. Please refer to the example code for details on usage."
        },
        validation: {
            description:
                "Object containing validation state and message. Please refer to the example code for details on usage."
        },
        onValuesChange: {
            description: "Function called when the range slider values change"
        },
        onValuesCommit: {
            description: "Function called when the range slider values are committed (on release)"
        }
    }
};
