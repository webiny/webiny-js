import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { SegmentedControlPrimitive } from "./SegmentedControlPrimitive.js";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as LockIcon } from "@webiny/icons/notifications.svg";

const meta: Meta<typeof SegmentedControlPrimitive> = {
    title: "Components/Form Primitives/SegmentedControl",
    component: SegmentedControlPrimitive,
    parameters: {
        layout: "padded"
    },
    render: args => {
        const [value, setValue] = useState(args.value);
        return (
            <div className={"w-full"}>
                <SegmentedControlPrimitive
                    {...args}
                    value={value}
                    onChange={value => setValue(value)}
                />
                <div className={"mt-4 text-center"}>
                    Current selected value: <pre>{value}</pre>
                </div>
            </div>
        );
    }
};

export default meta;

type Story = StoryObj<typeof SegmentedControlPrimitive>;

const items = [
    { label: "Item 1", value: "item1" },
    { label: "Item 2", value: "item2" },
    { label: "Item 3", value: "item3" },
    { label: "Item 4", value: "item4" }
];

const itemsWithIcons = [
    { label: "Item 1", value: "item1", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 2", value: "item2", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 3", value: "item3", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 4", value: "item4", icon: <Icon icon={<LockIcon />} label="Lock" /> }
];

export const Default: Story = {
    args: {
        items
    }
};

export const WithDefaultOption: Story = {
    args: {
        items,
        value: "item2"
    }
};

export const WithIcons: Story = {
    args: {
        items: itemsWithIcons,
        value: "item1"
    }
};

export const VariantLight: Story = {
    args: {
        items,
        value: "item1",
        variant: "light"
    }
};

export const VariantDimmed: Story = {
    args: {
        items,
        value: "item1",
        variant: "dimmed"
    }
};

export const VariantGhost: Story = {
    render: args => {
        const [value, setValue] = useState(args.value || "item1");
        return (
            <div className="p-md rounded-md bg-neutral-light">
                <SegmentedControlPrimitive
                    {...args}
                    items={items}
                    value={value}
                    onChange={value => setValue(value)}
                    variant="ghost"
                />
            </div>
        );
    }
};

export const Disabled: Story = {
    args: {
        items,
        value: "item2",
        disabled: true
    }
};

export const PartiallyDisabled: Story = {
    args: {
        items: [
            { label: "Item 1", value: "item1" },
            { label: "Item 2 (disabled)", value: "item2", disabled: true },
            { label: "Item 3", value: "item3" },
            { label: "Item 4 (disabled)", value: "item4", disabled: true }
        ],
        value: "item1"
    }
};

export const FullWidth: Story = {
    args: {
        items,
        value: "item1",
        fullWidth: true
    }
};
