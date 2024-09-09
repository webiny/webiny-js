import type { Meta, StoryObj } from "@storybook/react";

import { Avatar } from "./Avatar";
import * as React from "react";

const meta: Meta<typeof Avatar> = {
    title: "Components/Avatar",
    component: Avatar,
    tags: ["autodocs"],
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof Avatar>;

export const Default: Story = {
    args: {
        image: <Avatar.Image src="https://github.com/webiny-bot.png" alt="@webiny" />,
        fallback: <Avatar.Fallback>W</Avatar.Fallback>
    },
    argTypes: {
        size: {
            control: "select",
            options: ["sm", "md", "lg", "xl"]
        },
        variant: {
            control: "select",
            options: ["image"]
        }
    }
};

export const Sizes: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};
