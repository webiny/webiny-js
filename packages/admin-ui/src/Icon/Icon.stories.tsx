import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { ReactComponent as XIcon } from "@material-design-icons/svg/filled/close.svg";
import { fn } from "@storybook/test";
import { Icon } from "./Icon";

// More on how to set up stories at: https://storybook.js.org/docs/writing-stories#default-export
const meta: Meta<typeof Icon> = {
    title: "Components/Icon",
    component: Icon,
    // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
    tags: ["autodocs"]
};

export default meta;

type Story = StoryObj<typeof Icon>;

export const Default: Story = {
    args: {
        icon: <XIcon />,
        label: "Close"
    }
};

export const ClickableIcon: Story = {
    args: {
        icon: <XIcon />,
        label: "Close",
        className: "cursor-pointer",
        onClick: fn()
    }
};
