import React, { useState } from "react";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import type { Meta, StoryObj } from "@storybook/react";
import { Toast } from "./Toast.js";
import { useToast, type ShowToastParams } from "./useToast.js";
import { Button } from "~/Button/index.js";
import { Icon } from "~/Icon/index.js";

const ToastComponent = (props: ShowToastParams) => {
    const [lastToast, setLastToast] = useState<string | number>("");
    const { showToast, hideToast, hideAllToasts } = useToast();
    return (
        <>
            <Button
                text={"Show Toast"}
                onClick={() => {
                    const toast = showToast(props);
                    setLastToast(toast);
                }}
            />
            <Button text={"Hide latest toast"} onClick={() => hideToast(lastToast)} />
            <Button text={"Hide all toasts"} onClick={() => hideAllToasts()} />
        </>
    );
};

const meta: Meta<ShowToastParams> = {
    title: "Components/Toast",
    component: ToastComponent,
    parameters: {
        layout: "fullscreen"
    },
    argTypes: {
        variant: { control: "select", options: ["default", "subtle"] }
    },
    decorators: [
        Story => (
            <div className="w-full h-64 flex justify-center items-center gap-sm">
                <Story />
                <Toast.Provider />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<ShowToastParams>;

export const Default: Story = {
    args: {
        title: "New entry created"
    }
};

export const SubtleVariant: Story = {
    args: {
        ...Default.args,
        variant: "subtle"
    }
};

export const WithTitleComponent: Story = {
    args: {
        title: <Toast.Title text={"New entry created"} />
    }
};

export const WithDescription: Story = {
    args: {
        ...Default.args,
        description: 'Entry "Article One" has been successfully created'
    }
};

export const WithDescriptionComponent: Story = {
    args: {
        ...Default.args,
        description: (
            <Toast.Description text={'Entry "Article One" has been successfully created'} />
        )
    }
};

export const WithActions: Story = {
    args: {
        ...Default.args,
        actions: (
            <Toast.Actions>
                <Button
                    key={"action-1"}
                    text={"Do the action"}
                    onClick={() => console.log("doTheAction")}
                />
                <Button
                    key={"action-2"}
                    text={"Dismiss"}
                    onClick={() => console.log("dismiss")}
                    variant={"secondary"}
                />
            </Toast.Actions>
        )
    }
};

export const WithDescriptionAndActions: Story = {
    args: {
        ...Default.args,
        description: (
            <Toast.Description text={'Entry "Article One" has been successfully created'} />
        ),
        actions: (
            <Toast.Actions>
                <Button
                    key={"action-1"}
                    text={"Do the action"}
                    onClick={() => console.log("doTheAction")}
                />
                <Button
                    key={"action-2"}
                    text={"Dismiss"}
                    onClick={() => console.log("dismiss")}
                    variant={"secondary"}
                />
            </Toast.Actions>
        )
    }
};

export const WithCustomIcon: Story = {
    args: {
        ...Default.args,
        icon: <Icon icon={<SettingsIcon />} label={"Settings"} />
    }
};

export const WithInfiniteDuration: Story = {
    args: {
        ...Default.args,
        duration: Infinity
    }
};

export const NotDismissible: Story = {
    args: {
        ...Default.args,
        dismissible: false
    }
};

export const withCustomPosition: Story = {
    args: {
        ...Default.args,
        position: "bottom-right"
    }
};

export const Documentation: Story = {
    args: {
        title: "New entry created",
        description: "Entry has been successfully created",
        variant: "default",
        position: "top-right",
        duration: 6000,
        dismissible: true,
        actions: undefined,
        icon: undefined
    },
    argTypes: {
        title: {
            description: "Please refer to the 'With Title Component' example below for details."
        },
        description: {
            description:
                "Please refer to the 'With Description' and 'With Description Component' examples below for details."
        },
        variant: {
            description: "Variant of the toast."
        },
        actions: {
            description: "Please refer to the 'With Actions' example below for details."
        },
        icon: {
            description: "Please refer to the 'With Custom Icon' example below for details."
        },
        duration: {
            description:
                "Duration in milliseconds before the toast auto-dismisses. Please refer to the 'With Infinite Duration' example below for details.",
            control: "number"
        },
        dismissible: {
            description: "Please refer to the 'Not Dismissible' example below for details."
        },
        position: {
            description: "Please refer to the 'With Custom Position' example below for details.",
            control: "select",
            options: [
                "top-left",
                "top-right",
                "bottom-left",
                "bottom-right",
                "top-center",
                "bottom-center"
            ]
        }
    }
};
