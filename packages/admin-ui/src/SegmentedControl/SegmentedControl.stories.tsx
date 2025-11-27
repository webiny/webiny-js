import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-webpack5";
import { SegmentedControl } from "./SegmentedControl.js";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as LockIcon } from "@webiny/icons/notifications.svg";

const meta: Meta<typeof SegmentedControl> = {
    title: "Components/SegmentedControl",
    component: SegmentedControl
};

export default meta;
type Story = StoryObj<typeof SegmentedControl>;

const items = [
    { label: "Item", value: "item1" },
    { label: "Item", value: "item2" },
    { label: "Item", value: "item3" },
    { label: "Item", value: "item4" }
];

const itemsWithIcons = [
    { label: "Item 1", value: "item1", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 1", value: "item2", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 1", value: "item3", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item 1", value: "item4", icon: <Icon icon={<LockIcon />} label="Lock" /> }
];

export const Default: Story = {
    render: args => {
        const [value, setValue] = useState(args.value);
        return <SegmentedControl {...args} value={value} onChange={value => setValue(value)} />;
    },
    args: {
        items: itemsWithIcons
    }
};

export const VariantAccent: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <SegmentedControl items={items} value={value} onChange={setValue} variant="accent" />
        );
    }
};

export const VariantGhost: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="p-md rounded-md">
                <SegmentedControl items={items} value={value} onChange={setValue} variant="ghost" />
            </div>
        );
    }
};

export const WithFormComponent: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="space-y-lg">
                <SegmentedControl
                    label="Select an option"
                    description="Choose one of the available options"
                    items={items}
                    value={value}
                    onChange={setValue}
                />
                <SegmentedControl
                    label="With error"
                    items={items}
                    value={value}
                    onChange={setValue}
                    validation={{
                        isValid: false,
                        message: "This field is required"
                    }}
                />
                <SegmentedControl
                    label="Disabled"
                    items={items}
                    value={value}
                    onChange={setValue}
                    disabled
                />
            </div>
        );
    }
};

export const Disabled: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="space-y-md">
                <div>
                    <h3 className="text-lg font-semibold mb-sm">Fully Disabled</h3>
                    <SegmentedControl items={items} value={value} onChange={setValue} disabled />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-sm">Partially Disabled</h3>
                    <SegmentedControl
                        items={[
                            { label: "Item", value: "item1" },
                            { label: "Item (disabled)", value: "item2", disabled: true },
                            { label: "Item", value: "item3" },
                            { label: "Item (disabled)", value: "item4", disabled: true }
                        ]}
                        value={value}
                        onChange={setValue}
                    />
                </div>
            </div>
        );
    }
};
