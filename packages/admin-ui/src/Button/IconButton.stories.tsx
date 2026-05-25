import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { IconButton } from "./IconButton.js";

const meta: Meta<typeof IconButton> = {
    title: "Components/Icon Button",
    component: IconButton,
    tags: ["!autodocs"],
    argTypes: {
        variant: {
            description: "Type",
            control: "select",
            options: ["primary", "secondary", "tertiary", "ghost", "ghost-negative"],
            defaultValue: "primary"
        },
        size: {
            description: "Size",
            control: "select",
            options: ["xxs", "xs", "sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        iconSize: {
            description: "Icon Size",
            control: "select",
            options: ["default", "lg"],
            defaultValue: "default"
        },
        disabled: {
            description: "State",
            control: "boolean",
            defaultValue: false
        },
        icon: {
            description: "Please refer to the example above for usage information."
        },
        onClick: { action: "onClick" }
    }
};

export default meta;
type Story = StoryObj<typeof IconButton>;

export const Primary: Story = {
    args: {
        variant: "primary",
        icon: <AddIcon />
    }
};

export const Secondary: Story = {
    args: {
        ...Primary.args,
        variant: "secondary"
    }
};

export const Tertiary: Story = {
    args: {
        ...Primary.args,
        variant: "tertiary"
    }
};

export const Ghost: Story = {
    args: {
        ...Primary.args,
        variant: "ghost"
    }
};

export const GhostNegative: Story = {
    decorators: [
        Story => (
            <div className="bg-[#25292e] p-[300px] rounded-[5px]">
                <Story />
            </div>
        )
    ],
    args: {
        ...Primary.args,
        variant: "ghost-negative"
    }
};

export const DoubleExtraSmall: Story = {
    args: {
        ...Primary.args,
        size: "xxs"
    }
};

export const ExtraSmall: Story = {
    args: {
        ...Primary.args,
        size: "xs"
    }
};

export const Small: Story = {
    args: {
        ...Primary.args,
        size: "sm"
    }
};

export const SmallWithLargeIcon: Story = {
    args: {
        ...Primary.args,
        size: "sm",
        iconSize: "lg"
    }
};

export const Medium: Story = {
    args: {
        ...Primary.args,
        size: "md"
    }
};

export const MediumWithLargeIcon: Story = {
    args: {
        ...Primary.args,
        size: "md",
        iconSize: "lg"
    }
};

export const Large: Story = {
    args: {
        ...Primary.args,
        size: "lg"
    }
};

export const LargeWithLargeIcon: Story = {
    args: {
        ...Primary.args,
        size: "lg",
        iconSize: "lg"
    }
};

export const ExtraLarge: Story = {
    args: {
        ...Primary.args,
        size: "xl"
    }
};

export const WithAsChild: Story = {
    args: {
        ...Primary.args,
        asChild: true,
        icon: (
            <span>
                <AddIcon />
            </span>
        )
    }
};

export const Documentation: Story = {
    args: {
        variant: "primary",
        size: "md",
        disabled: false,
        icon: <AddIcon />,
        iconSize: "default"
    }
};
