import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { ReactComponent as HomeIcon } from "@webiny/icons/home.svg";
import { Breadcrumbs } from "./Breadcrumbs.js";

const meta: Meta<typeof Breadcrumbs> = {
    title: "Components/Breadcrumbs",
    component: Breadcrumbs,
    decorators: [
        Story => (
            <div className="w-[850px] rounded-sm bg-neutral-base px-md py-xs-plus">
                <Story />
            </div>
        )
    ]
};

export default meta;

type Story = StoryObj<typeof Breadcrumbs>;

const noop = () => undefined;

export const Default: Story = {
    args: {
        items: [
            { icon: <HomeIcon />, title: "Home", onClick: noop },
            { label: "Page Builder", onClick: noop },
            { label: "Articles", current: true }
        ]
    }
};

export const DeepTrail: Story = {
    args: {
        items: [
            { icon: <HomeIcon />, title: "Home", onClick: noop },
            { label: "Headless CMS", onClick: noop },
            { label: "Articles", onClick: noop },
            { label: "The best article ever written about breadcrumbs", current: true }
        ]
    }
};

export const HomeOnly: Story = {
    args: {
        items: [{ icon: <HomeIcon />, title: "Home", current: true }]
    }
};
