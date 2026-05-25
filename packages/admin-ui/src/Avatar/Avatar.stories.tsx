import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as StormIcon } from "@webiny/icons/storm.svg";
import { Avatar } from "./Avatar.js";

const meta: Meta<typeof Avatar> = {
    title: "Components/Avatar",
    component: Avatar,
    argTypes: {
        size: {
            control: "select",
            options: ["sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        variant: {
            control: "select",
            options: ["strong", "subtle", "light", "quiet", "outlined"],
            defaultValue: "strong"
        }
    }
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
    args: {
        image: <Avatar.Image src="https://i.pravatar.cc/300" alt="@webiny" />,
        fallback: <Avatar.Fallback delayMs={0}>W</Avatar.Fallback>
    }
};

export const SizeSm: Story = {
    name: "Small",
    args: {
        ...Default.args,
        size: "sm"
    }
};
export const SizeMd: Story = {
    name: "Medium",
    args: {
        ...Default.args,
        size: "md"
    }
};

export const SizeLg: Story = {
    name: "Large",
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const SizeXl: Story = {
    name: "Extra Large",
    args: {
        ...Default.args,
        size: "xl"
    }
};

export const Text: Story = {
    name: "Fallback Text",
    args: {
        fallback: <Avatar.Fallback>SH</Avatar.Fallback>
    }
};
export const Icon: Story = {
    name: "Icon",
    args: {
        fallback: (
            <Avatar.Fallback>
                <StormIcon />
            </Avatar.Fallback>
        )
    }
};

export const Documentation: Story = {
    render: args => {
        return (
            <Avatar
                {...args}
                image={args.image || <Avatar.Image src="https://i.pravatar.cc/300" alt="@webiny" />}
                fallback={args.fallback || <Avatar.Fallback delayMs={0}>W</Avatar.Fallback>}
            />
        );
    },
    args: {
        size: "md",
        variant: "strong",
        image: undefined,
        fallback: undefined,
        className: "commas, separated, class, name"
    },
    argTypes: {
        size: {
            description: "Controls the size of the avatar",
            control: "select",
            options: ["sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        variant: {
            description: "Controls the visual style of the avatar",
            control: "select",
            options: ["strong", "subtle", "light", "quiet", "outlined"],
            defaultValue: "strong"
        },
        image: {
            description:
                "The image element to display. Please refer to the example code for details on usage."
        },
        fallback: {
            description:
                "The fallback element to display when the image fails to load. Please refer to the example code for details on usage."
        },
        className: {
            description:
                "Additional CSS class names. You can pass multiple class names, separated by commas.",
            placeholder: "Enter class names, separated by commas.",
            control: "text"
        }
    }
};
