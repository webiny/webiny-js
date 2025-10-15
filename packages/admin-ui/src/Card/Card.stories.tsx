import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Card } from "./Card.js";
import { Button } from "~/Button/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { ReactComponent as NotificationIcon } from "@webiny/icons/notifications_active.svg";
import { Tabs } from "~/Tabs/index.js";


const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    argTypes: {}
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        size: "md",
        title: "Card Title",
        description: "A short card description.",
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
        actions: (
            <>
                <Card.CancelButton />
                <Card.ConfirmButton />
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

export const AlertCard: Story = {
    args: {
        ...Default.args,
        info: null,
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

export const DropdownMenuInCard: Story = {
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
        icon: <Card.Icon icon={<NotificationIcon />} label={"Title icon"} />
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
    args: {
        title: "Card Title",
        description: "A short card description.",
        bodyPadding: true,
        info: (
            <>
                Learn more about this <a href={"#"}>here</a>.
            </>
        ),
        children: (
            <>
                This is the card content area. You can place any content here including forms,
                text, images, or other components.
            </>
        ),
        actions: (
            <>
                <Card.CancelButton />
                <Card.ConfirmButton />
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
            description: "Controls the size of the card",
            control: "select",
            options: ["sm", "md", "lg", "xl", "full"]
        },
        bodyPadding: {
            description: "Add padding to the Card body.",
            control: "boolean",
            defaultValue: true
        },
        info: {
            description:
                "Additional info displayed below the description, please refer to the example below for details."
        },
        children: {
            description:
                "Content of the card, please refer to the 'With Dropdown Menu' and ''With Tabs' example below for details."
        },
        actions: {
            description:
                "Actions displayed in the footer, please refer to the code example for details."
        }
    }
};
