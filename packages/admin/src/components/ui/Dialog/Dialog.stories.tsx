import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Dialog } from "./index";
import { fn } from "@storybook/test";
import { Input } from "../Input";
import { Button } from "../Button";

const meta: Meta<typeof Dialog> = {
    title: "Components/Dialog",
    component: Dialog,
    tags: ["autodocs"]
};

export default meta;
type Story = StoryObj<typeof Dialog>;

export const Simple: Story = {
    args: {
        trigger: <Button>{"Open"}</Button>,
        title: "Are you absolutely sure?",
        description:
            "This action cannot be undone. This will permanently delete your account and remove your data from our servers.",
        content: (
            <>
                <Input type={"text"} placeholder={"First name"} />
                <Input type={"text"} placeholder={"Last name"} />
            </>
        ),
        onAccept: fn(),
        onAcceptLabel: "Send",
        onCancel: fn(),
        onCancelLabel: "Cancel",
        onOpenChange: fn()
    }
};
