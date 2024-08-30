import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Toast, ToastProvider } from "./Toast";
import { Button } from "~/Button";

const meta: Meta<typeof Toast> = {
    title: "Components/Toast",
    component: Toast,
    tags: ["autodocs"],
    decorators: [
        Story => (
            <ToastProvider>
                <div className="flex justify-center items-center h-48">
                    <Story />
                </div>
            </ToastProvider>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
    args: {
        title: "Toast title",
        content: "Toast content",
        children: <Button>{"Action"}</Button>
    }
};
