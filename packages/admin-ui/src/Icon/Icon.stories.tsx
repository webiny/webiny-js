import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as XIcon } from "@webiny/icons/close.svg";
import { Icon } from "./Icon.js";

const meta: Meta<typeof Icon> = {
    title: "Components/Icon",
    component: Icon
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
    args: {
        icon: <XIcon />,
        label: "This is an icon",
        size: "md",
        color: "accent"
    },
    argTypes: {
        size: {
            control: "select",
            options: ["xs", "sm", "md", "lg"]
        },
        color: {
            control: "select",
            options: [
                "accent",
                "neutral-light",
                "neutral-strong",
                "neutral-strong-transparent",
                "neutral-base",
                "neutral-negative",
                "inherit"
            ]
        }
    }
};

export const ColorInherit: Story = {
    decorators: [
        Story => (
            <div className="fill-success">
                <Story />
            </div>
        )
    ],
    args: {
        ...Default.args,
        color: "inherit"
    }
};

export const ColorAccent: Story = {
    args: {
        ...Default.args,
        color: "accent"
    }
};

export const ColorNeutralLight: Story = {
    args: {
        ...Default.args,
        color: "neutral-light"
    }
};

export const ColorNeutralStrong: Story = {
    args: {
        ...Default.args,
        color: "neutral-strong"
    }
};

export const ColorNeutralStrongTransparent: Story = {
    decorators: [
        Story => (
            <div className="bg-neutral-disabled p-3xl rounded-md">
                <Story />
            </div>
        )
    ],
    args: {
        ...Default.args,
        color: "neutral-strong-transparent"
    }
};

export const ColorNeutralBase: Story = {
    decorators: [
        Story => (
            <div className="bg-neutral-dark p-3xl rounded-md">
                <Story />
            </div>
        )
    ],
    args: {
        ...Default.args,
        color: "neutral-base"
    }
};

export const ColorNeutralNegative: Story = {
    decorators: [
        Story => (
            <div className="bg-neutral-dark p-3xl rounded-md">
                <Story />
            </div>
        )
    ],
    args: {
        ...Default.args,
        color: "neutral-negative"
    }
};

export const SizeXs: Story = {
    args: {
        ...Default.args,
        size: "xs"
    }
};

export const SizeSm: Story = {
    args: {
        ...Default.args,
        size: "sm"
    }
};

export const SizeMd: Story = {
    args: {
        ...Default.args,
        size: "md"
    }
};

export const SizeLg: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const Documentation: Story = {
    args: {
        icon: <XIcon />,
        label: "Close icon",
        size: "md",
        color: "accent",
        className: ""
    },
    argTypes: {
        icon: {
            description:
                "The SVG icon component to be rendered. Please refer to the example code for details."
        },
        label: {
            description: "Accessible label for the icon (for screen readers)",
            control: "text"
        },
        size: {
            description: "The size of the icon",
            control: "select",
            options: ["xs", "sm", "md", "lg"]
        },
        color: {
            description: "The color of the icon",
            control: "select",
            options: [
                "inherit",
                "accent",
                "neutral-base",
                "neutral-light",
                "neutral-strong",
                "neutral-strong-transparent",
                "neutral-negative"
            ]
        },
        className: {
            description:
                "Additional CSS classes to apply to the icon. You can pass multiple classes, separated by commas or spaces.",
            control: "text"
        }
    }
};
