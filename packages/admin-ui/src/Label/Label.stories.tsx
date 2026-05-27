import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Label } from "./Label.js";
import { Tooltip } from "~/Tooltip/index.js";
import { Input } from "~/Input/index.js";

const meta: Meta<typeof Label> = {
    title: "Components/Form/Label",
    component: Label,
    parameters: {
        layout: "padded"
    },
    decorators: [
        Story => (
            <Tooltip.Provider>
                <Story />
            </Tooltip.Provider>
        )
    ]
};

export default meta;
type Story = StoryObj<typeof Label>;

export const Documentation: Story = {
    render: args => {
        const [value, setValue] = React.useState("");

        return (
            <div className="mb-4 space-y-2">
                <Label {...args} />
                <Input
                    id={args.htmlFor}
                    type="text"
                    placeholder="e.g. John Michael Doe"
                    required={args.required}
                    value={value}
                    onChange={e => setValue(e.target.value)}
                />
            </div>
        );
    },
    args: {
        text: "Full Name",
        htmlFor: "full-name",
        description: "As shown on your government-issued ID",
        hint: "Include middle name if applicable",
        required: true,
        disabled: false,
        weight: "strong",
        value: "Label value will be shown here",
        invalid: false
    },
    argTypes: {
        text: {
            description: "The text content of the label",
            control: "text"
        },
        htmlFor: {
            description: "The ID of the form element this label is associated with",
            control: "text"
        },
        description: {
            description: "Additional descriptive text shown next to the label",
            control: "text"
        },
        hint: {
            description: "Tooltip hint text that appears on hover",
            control: "text"
        },
        required: {
            description: "Whether the associated form field is required",
            control: "boolean"
        },
        disabled: {
            description: "Whether the label should appear disabled",
            control: "boolean"
        },
        weight: {
            description: "The font weight of the label text",
            control: "select",
            options: ["strong", "light"]
        },
        value: {
            description: "Optional value to display on the right side of the label",
            control: "text"
        },
        invalid: {
            description: "Whether the label should appear in an invalid state",
            control: "boolean"
        }
    }
};

export const Default: Story = {
    args: {
        text: "Test label",
        htmlFor: "test-field"
    },
    render: args => (
        <>
            <input type="checkbox" id={args.htmlFor} />
            <Label {...args} />
        </>
    )
};

export const LightWeight: Story = {
    args: {
        ...Default.args,
        weight: "light"
    }
};

export const Required: Story = {
    args: {
        ...Default.args,
        required: true
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        description: "(description)"
    }
};

export const WithHint: Story = {
    args: {
        ...Default.args,
        hint: "This is an additional message in case context to this label needs to be added"
    }
};

export const WithValue: Story = {
    args: {
        ...Default.args,
        value: 24
    },
    render: args => (
        <div className="w-64">
            <Label {...args} />
        </div>
    )
};

export const Disabled: Story = {
    args: {
        htmlFor: "test-field-disabled",
        text: "Test label",
        description: "(description)",
        hint: "This is an additional message in case context to this label needs to be added",
        required: true,
        disabled: true,
        value: 24
    },
    render: args => (
        <div className="w-64">
            <Label {...args} />
        </div>
    )
};
