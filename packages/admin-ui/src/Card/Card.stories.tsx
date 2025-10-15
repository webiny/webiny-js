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
    argTypes: {},
    decorators: [
        Story => (
            <div className="wby-bg-[#f9fafa] wby-p-[350px] wby-rounded-[5px] wby-text-neutral-dimmed">
                <Story />
            </div>
        )
    ]
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
        ),
        topActions: (
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
