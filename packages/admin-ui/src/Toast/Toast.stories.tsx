import React from "react";
import type { Meta, StoryObj } from "@storybook/react";

import {
    Toast,
    ToastProvider,
    ToastViewport,
    ToastAction,
    ToastTitle,
    ToastDescription
} from "./Toast";
import { Button } from "~/Button";

const meta: Meta<typeof Toast> = {
    title: "Components/Toast",
    component: Toast,
    tags: ["autodocs"],
    parameters: {
        layout: "fullscreen"
    },
    decorators: [
        (Story, context) => {
            const [open, setOpen] = React.useState<boolean>(false);
            const timerRef = React.useRef(0);

            React.useEffect(() => {
                return () => clearTimeout(timerRef.current);
            }, []);

            return (
                <ToastProvider>
                    <div className="w-full h-64 flex justify-center items-center">
                        <Button
                            text={"Display Toast"}
                            onClick={() => {
                                setOpen(false);
                                window.clearTimeout(timerRef.current);
                                timerRef.current = window.setTimeout(() => {
                                    setOpen(true);
                                }, 100);
                            }}
                        />
                        <Story args={{ ...context.args, open: open, onOpenChange: setOpen }} />
                        <ToastViewport />
                    </div>
                </ToastProvider>
            );
        }
    ]
};

export default meta;

type Story = StoryObj<typeof Toast>;

export const Default: Story = {
    args: {
        title: <ToastTitle text={"New entry created"} />,
        description: (
            <ToastDescription text={'Entry "Article One" has been successfully created'} />
        ),
        actions: [
            <ToastAction
                key={"open"}
                text={"Open"}
                altText={"Open Entry"}
                onClick={e => console.log("open", e)}
            />
        ]
    }
};

export const Accent: Story = {
    args: {
        ...Default.args,
        variant: "accent"
    }
};
