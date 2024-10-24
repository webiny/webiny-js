import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as XIcon } from "@material-design-icons/svg/filled/close.svg";
import { Icon } from "./Icon";

const meta: Meta<typeof Icon> = {
    title: "Components/Icon",
    component: Icon,
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
    args: {
        icon: <XIcon />,
        label: "Close",
        size: "md",
        color: "primary"
    },
    argTypes: {
        size: {
            control: "select",
            options: ["sm", "md", "lg"]
        },
        color: {
            control: "select",
            options: ["primary", "dark", "light", "white"]
        }
    }
};

export const ClickableIcon: Story = {
    args: {
        icon: <XIcon />,
        label: "Close",
        className: "cursor-pointer"
    },
    argTypes: {
        // Note: after upgrading to Storybook 8.X, use `fn`from `@storybook/test` to spy on the onClick argument.
        onClick: { action: "onClick" }
    }
};

export const Sizes: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const Colors: Story = {
    args: {
        ...Default.args,
        color: "light"
    }
};
