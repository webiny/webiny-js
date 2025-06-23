import React from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { Drawer } from "./Drawer";
import { Button } from "~/Button";
import { DropdownMenu } from "~/DropdownMenu";
import { Tabs } from "~/Tabs";
import { ReactComponent as DoorbellIcon } from "@webiny/icons/ring_volume.svg";

const meta: Meta<typeof Drawer> = {
    title: "Components/Drawer",
    component: Drawer,
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof Drawer>;

export const Default: Story = {
    args: {
        trigger: <Button variant="primary" text={"Open"} />,
        title: "Drawer Title",
        description: "A short dialog description.",
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                <p className={"wby-mb-md"}>
                    The amazing, splendid, and most useful umbrella, resistant to rain and friendly
                    to winds, is something that deserves all admiration. Crafted with perfect
                    textures, it bravely withstands storms and gently shades the rays of the sun. A
                    remarkable innovation, with an ergonomically designed grip most suited to the
                    hand, it remains stable even in the fiercest weather.
                </p>
                <p className={"wby-mb-md"}>
                    Its fabric, woven from the highest quality materials, ensures that you stay dry,
                    no matter the intensity of the rain. With a frame engineered for strength yet
                    lightweight enough to carry with ease, this umbrella is a marvel of modern
                    design. Not just a shield against the elements, but a companion in your everyday
                    journey, it provides peace of mind, knowing you’re prepared for whatever the
                    skies may bring.
                </p>
                <p className={"wby-mb-md"}>
                    The sleek, stylish design complements any outfit, making it not only a practical
                    accessory but also a fashion statement. With its smooth opening mechanism, you
                    can effortlessly transition from a sunny day to a rainy one without missing a
                    beat. Whether you are navigating through a busy city street or enjoying a quiet
                    stroll in the park, this umbrella offers unmatched comfort and protection.
                </p>
                <p className={"wby-mb-md"}>
                    Indeed, it is not just an umbrella — it is an experience. One that elevates your
                    daily routine, making every step in both sun and storm feel just a little bit
                    brighter.
                </p>
            </>
        ),
        onOpenChange: opened => {
            console.log(`Drawer is ${opened ? "opened" : "closed"}.`);
        },
        actions: (
            <>
                <Drawer.CancelButton />
                <Drawer.ConfirmButton />
            </>
        ),
        bodyPadding: true,
        headerSeparator: true,
        footerSeparator: true
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

export const ControlledVisibility: Story = {
    render: props => {
        const [open, setOpen] = React.useState(false);

        return (
            <>
                <Button variant="primary" text={"Open"} onClick={() => setOpen(true)} />
                <Drawer
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
    args: {
        ...Default.args,
        trigger: null,
        children: <>This drawer&apos;s visibility is controlled by the open state.</>
    }
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
                        text={"Open Drawer"}
                        content={"Open Drawer"}
                        onClick={() => setOpen(true)}
                    />
                </DropdownMenu>

                <Drawer {...props} open={open} onOpenChange={() => setOpen(false)} />
            </>
        );
    },
    args: {
        ...Default.args,
        trigger: null,
        children: <>This drawer is opened from a dropdown menu item.</>
    }
};

export const WithoutCloseButton: Story = {
    args: {
        ...Default.args,
        showCloseButton: false,
        children: <>This drawer is opened from a dropdown menu item.</>
    }
};

export const CustomWidth: Story = {
    args: {
        ...Default.args,
        width: 1000,
        children: <>This drawer has a custom width of 1000px, making it wider than the default.</>
    }
};

export const WithTabs: Story = {
    args: {
        ...Default.args,
        bodyPadding: false,
        headerSeparator: false,
        children: (
            <>
                <Tabs
                    spacing={"lg"}
                    tabs={[
                        <Tabs.Tab
                            key="account"
                            value="account"
                            trigger={"Account"}
                            content={"Make changes to your account here."}
                        />,
                        <Tabs.Tab
                            key="company"
                            value="company"
                            trigger={"Company"}
                            content={"Make changes to your company info here."}
                        />,
                        <Tabs.Tab
                            key="security"
                            value="security"
                            trigger={"Security"}
                            content={"Make changes to your security settings here."}
                        />,
                        <Tabs.Tab
                            key="development"
                            value="development"
                            trigger={"Development"}
                            content={"Make changes to your development settings here."}
                        />
                    ]}
                />
            </>
        )
    }
};

export const DropdownMenuInDrawer: Story = {
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

export const WithIcon: Story = {
    args: {
        ...Default.args,
        icon: <Drawer.Icon icon={<DoorbellIcon />} label={"Icon label..."} />,
        children: <>The icon helps to visually identify the purpose of this drawer.</>
    }
};

export const AsModal: Story = {
    args: {
        ...Default.args,
        modal: true,
        children: (
            <>
                This drawer has modal=true, which means it will show an overlay behind it and
                prevent interaction with the content underneath.
            </>
        )
    }
};

export const Documentation: Story = {
    render: args => {
        const [open, setOpen] = React.useState(false);

        return (
            <>
                <Button variant="primary" text="Open Drawer" onClick={() => setOpen(true)} />

                <Drawer {...args} open={open} onOpenChange={open => setOpen(open)} />
            </>
        );
    },
    args: {
        title: "Drawer Title",
        description: "A short drawer description.",
        showCloseButton: true,
        bodyPadding: true,
        headerSeparator: true,
        footerSeparator: true,
        side: "right",
        modal: false,
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                <p className={"wby-mb-md, wby-mt-md"}>
                    This is the drawer content area. You can place any content here including forms,
                    text, images, or other components.
                </p>
                <p className={"wby-mb-md"}>
                    Drawers are useful for displaying additional information or actions without
                    navigating away from the current page.
                </p>
            </>
        ),
        actions: (
            <>
                <Drawer.CancelButton />
                <Drawer.ConfirmButton />
            </>
        ),
        width: undefined
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
        side: {
            description: "Side from which the drawer appears",
            control: "select",
            options: ["left", "right"],
            defaultValue: "right"
        },
        size: {
            description: "Controls the size of the drawer",
            control: "select",
            options: ["sm", "md", "lg", "xl"],
            defaultValue: "md"
        },
        showCloseButton: {
            description: "Show close button in the top-right corner",
            control: "boolean",
            defaultValue: true
        },
        modal: {
            description: "Whether the drawer should behave as a modal",
            control: "boolean",
            defaultValue: false
        },
        bodyPadding: {
            description: "Add padding to the drawer body",
            control: "boolean",
            defaultValue: true
        },
        headerSeparator: {
            description: "Show separator below the header",
            control: "boolean",
            defaultValue: true
        },
        footerSeparator: {
            description: "Show separator above the footer",
            control: "boolean",
            defaultValue: true
        },
        width: {
            description:
                'Width defines the horizontal size of the Drawer and accepts any valid CSS width value. You can pass a number (interpreted as pixels) or a string like "80%", "50vw", "auto", etc., following React.CSSProperties["width"] types.',
            control: "none"
        },
        info: {
            description:
                "Additional info displayed below the description, please refer to the example below for details.",
            control: "none"
        },
        children: {
            description:
                "Content of the Drawer, please refer to the 'With Dropdown Menu' and ''With Tabs' example below for details.",
            control: "none"
        },
        actions: {
            description:
                "Actions displayed in the footer, please refer to the code example for details.",
            control: "none"
        }
    }
};
