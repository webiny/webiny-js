import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { TextareaPrimitive } from "./TextareaPrimitive";

const meta: Meta<typeof TextareaPrimitive> = {
    title: "Components/Form Primitives/Textarea",
    component: TextareaPrimitive,
    argTypes: {
        onChange: { action: "onChange" },
        onEnter: { action: "onEnter" },
        onKeyDown: { action: "onKeyDown" },
        rows: {
            control: {
                type: "number"
            }
        }
    },
    parameters: {
        layout: "padded"
    }
};

export default meta;
type Story = StoryObj<typeof TextareaPrimitive>;

export const Default: Story = {};

export const MediumSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "md"
    }
};

export const LargeSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "lg"
    }
};

export const ExtraLargeSize: Story = {
    args: {
        placeholder: "Custom placeholder",
        size: "xl"
    }
};

export const PrimaryVariant: Story = {
    args: {
        variant: "primary",
        placeholder: "Custom placeholder"
    }
};

export const PrimaryVariantDisabled: Story = {
    args: {
        ...PrimaryVariant.args,
        disabled: true
    }
};

export const PrimaryVariantInvalid: Story = {
    args: {
        ...PrimaryVariant.args,
        invalid: true
    }
};

export const SecondaryVariant: Story = {
    args: {
        variant: "secondary",
        placeholder: "Custom placeholder"
    }
};

export const SecondaryVariantDisabled: Story = {
    args: {
        ...SecondaryVariant.args,
        disabled: true
    }
};

export const SecondaryVariantInvalid: Story = {
    args: {
        ...SecondaryVariant.args,
        invalid: true
    }
};

export const GhostVariant: Story = {
    args: {
        variant: "ghost",
        placeholder: "Custom placeholder"
    }
};

export const GhostVariantDisabled: Story = {
    args: {
        ...GhostVariant.args,
        disabled: true
    }
};

export const GhostVariantInvalid: Story = {
    args: {
        ...GhostVariant.args,
        invalid: true
    }
};

export const GhostNegativeVariant: Story = {
    args: {
        variant: "ghost-negative",
        placeholder: "Custom placeholder"
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const GhostNegativeVariantDisabled: Story = {
    args: {
        ...GhostNegativeVariant.args,
        disabled: true
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const GhostNegativeVariantInvalid: Story = {
    args: {
        ...GhostNegativeVariant.args,
        invalid: true
    },
    decorators: [
        Story => (
            <div className="wby-bg-neutral-dark wby-p-xl">
                <Story />
            </div>
        )
    ]
};

export const WithForwardEventOnChange: Story = {
    args: {
        ...Default.args,
        forwardEventOnChange: true
    }
};
