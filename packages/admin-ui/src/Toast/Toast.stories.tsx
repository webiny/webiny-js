import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import { Toast, ToastProvider, ToastViewport, ToastAction } from "./Toast";

const meta: Meta<typeof Toast> = {
    title: "Components/Toast",
    component: Toast,
    tags: ["autodocs"],
    decorators: [
        Story => (
            <ToastProvider>
                <div className="w-full">
                    <Story />
                    <ToastViewport />
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
        actions: [
            <ToastAction key={"action-1"} altText={"Action 1"} onClick={e => console.log("e1", e)}>
                {"Action 1"}
            </ToastAction>,
            <ToastAction key={"action-2"} altText={"Action 2"} onClick={e => console.log("e2", e)}>
                {"Action 2"}
            </ToastAction>
        ],
        defaultOpen: true
    }
};
