import React from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { Card } from "./Card.js";
import { Button } from "~/Button/index.js";
import { DropdownMenu } from "~/DropdownMenu/index.js";
import { ReactComponent as NotificationIcon } from "@webiny/icons/notifications_active.svg";
import { Tabs } from "~/Tabs";

const meta: Meta<typeof Card> = {
    title: "Components/Card",
    component: Card,
    argTypes: {},
    decorators: [
        Story => (
            <div className="bg-[#f9fafa] p-[50px] rounded-[5px] max-w-[800px] text-neutral-dimmed">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Card>;

export const Default: Story = {
    args: {
        padding: "md",
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
                <Card.CancelAction />
                <Card.ConfirmAction />
            </>
        )
    },
    argTypes: {}
};

export const SmallSize: Story = {
    args: {
        ...Default.args,
        size: "sm"
    }
};

export const PaddingSmall: Story = {
    args: {
        ...Default.args,
        padding: "sm"
    }
};

export const PaddingMedium: Story = {
    args: {
        ...Default.args,
        padding: "md"
    }
};

export const PaddingLarge: Story = {
    args: {
        ...Default.args,
        padding: "lg"
    }
};

export const WithActions: Story = {
    args: {
        ...Default.args
    }
};
export const WithHeaderActions: Story = {
    args: {
        ...Default.args,
        actionsPosition: "header"
    }
};

export const WithSmallHeaderActions: Story = {
    args: {
        ...Default.args,
        actionsPosition: "header",
        actionsSize: "sm"
    }
};

export const WithLargeCorners: Story = {
    args: {
        ...Default.args,
        cornerSize: "lg"
    }
};

export const AccentVariant: Story = {
    args: {
        ...Default.args,
        variant: "accent"
    }
};

export const DropdownMenuInCard: Story = {
    args: {
        ...Default.args,
        children: (
            <>
                <DropdownMenu trigger={<Button variant="primary" text={"Open"} />}>
                    <DropdownMenu.Item text={"Billing"} />
                    <DropdownMenu.Item text={"Settings"} />
                    <DropdownMenu.Item text={"Keyboard shortcuts"} />
                </DropdownMenu>
            </>
        )
    }
};
export const WithSmallElevation: Story = {
    args: {
        ...Default.args,
        elevation: "small"
    }
};

export const WithMediumElevation: Story = {
    args: {
        ...Default.args,
        elevation: "medium"
    }
};

export const WithLargeElevation: Story = {
    args: {
        ...Default.args,
        elevation: "large"
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
        icon: <Card.Icon icon={<NotificationIcon />} label={"Title icon"} />,
        children: (
            <>
                <Tabs
                    className={"w-[500px]"}
                    separator={true}
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
