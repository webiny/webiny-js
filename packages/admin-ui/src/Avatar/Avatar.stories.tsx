import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarImage, AvatarFallback } from "./Avatar";
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
        image: <AvatarImage src="https://github.com/webiny-bot.png" alt="@webiny" />,
        fallback: <AvatarFallback content={"W"}/>
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