import React, { useState } from "react";
import { library } from "@fortawesome/fontawesome-svg-core";
import { fas } from "@fortawesome/free-solid-svg-icons";
import type { Meta, StoryObj } from "@storybook/react";
import { Dialog } from "./Dialog";
import { Button } from "~/Button";
import { DropdownMenu } from "~/DropdownMenu";
import { ReactComponent as NotificationIcon } from "@webiny/icons/notifications_active.svg";
import { Tabs } from "~/Tabs";
import { IconPicker } from "~/IconPicker";

// @ts-expect-error
library.add(fas);

const meta: Meta<typeof Dialog> = {
    title: "Components/Dialog",
    component: Dialog,
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof Dialog>;

export const Default: Story = {
    args: {
        size: "md",
        trigger: <Button variant="primary" text={"Open"} />,
        title: "Dialog Title",
        description: "A short dialog description.",
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                The amazing, splendid, and most useful umbrella, resistant to rain and friendly to
                winds, is something that deserves all admiration. Crafted with perfect textures, it
                bravely withstands storms and gently shades the rays of the sun. A remarkable
                innovation, with an ergonomically designed grip most suited to the hand, it remains
                stable even in the fiercest weather.
            </>
        ),
        onOpenChange: opened => {
            console.log(`Dialog is ${opened ? "opened" : "closed"}.`);
        },
        actions: (
            <>
                <Dialog.CancelButton />
                <Dialog.ConfirmButton />
            </>
        )
    },
    argTypes: {}
};

export const SizeSmall: Story = {
    args: {
        ...Default.args,
        size: "sm"
    }
};

export const SizeMedium: Story = {
    args: {
        ...Default.args,
        size: "md"
    }
};

export const SizeLarge: Story = {
    args: {
        ...Default.args,
        size: "lg"
    }
};

export const SizeExtraLarge: Story = {
    args: {
        ...Default.args,
        size: "xl"
    }
};

export const SizeFullScreen: Story = {
    args: {
        ...Default.args,
        size: "full"
    }
};

export const ControlledVisibility: Story = {
    render: props => {
        const [open, setOpen] = React.useState(false);

        return (
            <>
                <Button variant="primary" text={"Open"} onClick={() => setOpen(true)} />
                <Dialog
                    {...props}
                    open={open}
                    onOpenChange={open => {
                        if (!open) {
                            setOpen(false);
                        }
                    }}
                />
            </>
        );
    },
    args: { ...Default.args, trigger: null }
};

export const WithOpenCloseEventHandler: Story = {
    args: {
        ...Default.args,
        onClose: () => {
            console.log("onClose triggered");
        },
        onOpen: () => {
            console.log("onOpen triggered");
        }
    }
};

export const WithDropdownMenu: Story = {
    render: props => {
        const [open, setOpen] = React.useState(false);

        return (
            <>
                <DropdownMenu trigger={<Button variant="primary" text={"Open"} />}>
                    <DropdownMenu.Item
                        text={"Open Dialog"}
                        content={"Open Dialog"}
                        onClick={() => setOpen(true)}
                    />
                </DropdownMenu>

                <Dialog {...props} open={open} onOpenChange={() => setOpen(false)} />
            </>
        );
    },
    args: { ...Default.args, trigger: null }
};

export const WithoutCloseButton: Story = {
    args: { ...Default.args, showCloseButton: false }
};

export const AlertDialog: Story = {
    args: {
        ...Default.args,
        info: null,
        showCloseButton: false,
        title: "Confirm Action",
        description: "Are you sure you want to delete this item?",
        children: (
            <>
                <p>This action cannot be undone.</p>
                <p>Deleted items cannot be recovered.</p>
            </>
        )
    }
};

export const DropdownMenuInDialog: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                <DropdownMenu trigger={<Button variant="primary" text={"Open"} />}>
                    <DropdownMenu.Item content={"Billing"} />
                    <DropdownMenu.Item content={"Settings"} />
                    <DropdownMenu.Item content={"Keyboard shortcuts"} />
                </DropdownMenu>
            </>
        )
    }
};

export const DropdownIconPickerInDialog: Story = {
    args: {
        ...Default.args
    },
    render: args => {
        const [value, setValue] = useState("");
        return (
            <Dialog {...args}>
                <IconPicker
                    icons={[
                        { prefix: "fas", name: "trash-restore-alt" },
                        { prefix: "fas", name: "trash-can-arrow-up" },
                        { prefix: "fas", name: "naira-sign" },
                        { prefix: "fas", name: "cart-arrow-down" },
                        { prefix: "fas", name: "walkie-talkie" },
                        { prefix: "fas", name: "file-edit" },
                        { prefix: "fas", name: "file-pen" },
                        { prefix: "fas", name: "receipt" },
                        { prefix: "fas", name: "pen-square" },
                        { prefix: "fas", name: "pencil-square" },
                        { prefix: "fas", name: "square-pen" },
                        { prefix: "fas", name: "suitcase-rolling" },
                        { prefix: "fas", name: "person-circle-exclamation" },
                        { prefix: "fas", name: "chevron-down" },
                        { prefix: "fas", name: "battery" },
                        { prefix: "fas", name: "battery-5" },
                        { prefix: "fas", name: "battery-full" },
                        { prefix: "fas", name: "skull-crossbones" },
                        { prefix: "fas", name: "code-compare" },
                        { prefix: "fas", name: "list-dots" },
                        { prefix: "fas", name: "list-ul" },
                        { prefix: "fas", name: "school-lock" },
                        { prefix: "fas", name: "tower-cell" },
                        { prefix: "fas", name: "long-arrow-alt-down" },
                        { prefix: "fas", name: "down-long" },
                        { prefix: "fas", name: "ranking-star" },
                        { prefix: "fas", name: "chess-king" },
                        { prefix: "fas", name: "person-harassing" },
                        { prefix: "fas", name: "brazilian-real-sign" },
                        { prefix: "fas", name: "landmark-alt" }
                    ]}
                    value={value}
                    onChange={value => {
                        console.log("Selected icon:", value);
                        setValue(value);
                    }}
                />
            </Dialog>
        );
    }
};

export const WithIcon: Story = {
    args: {
        ...Default.args,
        icon: <Dialog.Icon icon={<NotificationIcon />} label={"Title icon"} />
    }
};

export const PreventOutsideDismiss: Story = {
    args: {
        ...Default.args,
        dismissible: false
    }
};

export const WithTabs: Story = {
    args: {
        ...Default.args,
        bodyPadding: false,
        children: (
            <>
                <Tabs
                    spacing={"lg"}
                    tabs={[
                        <Tabs.Tab
                            key={"account"}
                            value={"account"}
                            trigger={"Account"}
                            content={"Make changes to your account here."}
                        />,
                        <Tabs.Tab
                            key={"company"}
                            value={"company"}
                            trigger={"Company"}
                            content={"Make changes to your company info here."}
                        />,
                        <Tabs.Tab
                            key={"security"}
                            value={"security"}
                            trigger={"Security"}
                            content={"Make changes to your security settings here."}
                        />,
                        <Tabs.Tab
                            key={"development"}
                            value={"development"}
                            trigger={"Development"}
                            content={"Make changes to your development settings here."}
                        />
                    ]}
                />
            </>
        )
    }
};

export const Documentation: Story = {
    render: args => {
        const [open, setOpen] = useState(false);

        return (
            <>
                <Button variant="primary" text="Open Dialog" onClick={() => setOpen(true)} />

                <Dialog {...args} open={open} onOpenChange={open => setOpen(open)} />
            </>
        );
    },
    args: {
        title: "Dialog Title",
        description: "A short dialog description.",
        showCloseButton: true,
        dismissible: true,
        bodyPadding: true,
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                This is the dialog content area. You can place any content here including forms,
                text, images, or other components.
            </>
        ),
        actions: (
            <>
                <Dialog.CancelButton />
                <Dialog.ConfirmButton />
            </>
        )
    },
    argTypes: {
        title: {
            description: "Title displayed in the header",
            control: "text"
        },
        description: {
            description: "Description displayed below the title",
            control: "text"
        },
        size: {
            description: "Controls the size of the dialog",
            control: "select",
            options: ["sm", "md", "lg", "xl", "full"]
        },
        showCloseButton: {
            description:
                "Show close button, please refer to the 'Without Close Button' example below for details.",
            control: "boolean",
            defaultValue: true
        },
        dismissible: {
            description:
                "Allow dialog to be dismissed by clicking outside or pressing Escape, please refer to the 'Prevent Outside Dismiss' example below for details.",
            control: "boolean",
            defaultValue: true
        },
        bodyPadding: {
            description: "Add padding to the Dialog body.",
            control: "boolean",
            defaultValue: true
        },
        info: {
            description:
                "Additional info displayed below the description, please refer to the example below for details.",
            control: "none"
        },
        children: {
            description:
                "Content of the dialog, please refer to the 'With Dropdown Menu' and ''With Tabs' example below for details.",
            control: "none"
        },
        actions: {
            description:
                "Actions displayed in the footer, please refer to the code example for details.",
            control: "none"
        }
    }
};
