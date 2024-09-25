import React from "react";
import { ReactComponent as SettingsIcon } from "@material-design-icons/svg/outlined/settings.svg";
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
    argTypes: {
        // Note: after upgrading to Storybook 8.X, use `fn`from `@storybook/test` to spy on the onOpenChange argument.
        onOpenChange: { action: "onOpenChange" }
    },
    decorators: [
        (Story, context) => {
            const { args } = context;
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
                        <Story
                            args={{
                                ...args,
                                open: open,
                                onOpenChange: open => {
                                    setOpen(open);
                                    if (typeof args.onOpenChange === "function") {
                                        args.onOpenChange(open);
                                    }
                                }
                            }}
                        />
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
        title: <ToastTitle text={"New entry created"} />
    }
};

export const Accent: Story = {
    args: {
        ...Default.args,
        variant: "accent"
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        description: <ToastDescription text={'Entry "Article One" has been successfully created'} />
    }
};

export const WithActions: Story = {
    args: {
        ...Default.args,
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

export const WithCustomIcon: Story = {
    args: {
        ...Default.args,
        icon: <SettingsIcon />
    }
};
