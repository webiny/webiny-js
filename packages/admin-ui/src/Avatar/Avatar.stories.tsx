import type { Meta, StoryObj } from "@storybook/react";

import { Avatar, AvatarImage } from "./Avatar";
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
        fallback: "W"
    }
};
