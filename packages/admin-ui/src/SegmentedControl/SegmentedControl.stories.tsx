import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react";
import { SegmentedControl } from "./SegmentedControl.js";
import { Icon } from "~/Icon/index.js";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";

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
    { label: "Item", value: "item1", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item", value: "item2", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item", value: "item3", icon: <Icon icon={<LockIcon />} label="Lock" /> },
    { label: "Item", value: "item4", icon: <Icon icon={<LockIcon />} label="Lock" /> }
];

export const General: Story = {
    render: () => {
        const [value, setValue] = useState("item1");
        return (
            <div className="space-y-md">
                <div>
                    <h3 className="text-lg font-semibold mb-sm">Selected Item</h3>
                    <SegmentedControl items={items} value={value} onChange={setValue} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-sm">Resting Item</h3>
                    <SegmentedControl items={items} value={value} onChange={setValue} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold mb-sm">With Icons (optional)</h3>
                    <SegmentedControl items={itemsWithIcons} value={value} onChange={setValue} />
                </div>
            </div>
        );
    }
};

export const VariantAccent: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <SegmentedControl
                items={items}
                value={value}
                onChange={setValue}
                variant="accent"
            />
        );
    }
};

export const VariantGhost: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="bg-neutral-xstrong p-md rounded-md">
                <SegmentedControl
                    items={items}
                    value={value}
                    onChange={setValue}
                    variant="ghost"
                />
            </div>
        );
    }
};

export const StatesAccent: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="space-y-md">
                <div>
                    <p className="text-sm mb-xs">Default</p>
                    <SegmentedControl
                        items={items}
                        value={value}
                        onChange={setValue}
                        variant="accent"
                    />
                </div>
                <div>
                    <p className="text-sm mb-xs bg-neutral-strong text-neutral-light px-xs-plus py-xs rounded inline-block">
                        Active
                    </p>
                    <SegmentedControl
                        items={items}
                        value="item1"
                        onChange={() => {}}
                        variant="accent"
                    />
                </div>
                <div>
                    <p className="text-sm mb-xs bg-neutral-strong text-neutral-light px-xs-plus py-xs rounded inline-block">
                        Enabled
                    </p>
                    <SegmentedControl
                        items={items}
                        value={value}
                        onChange={setValue}
                        variant="accent"
                    />
                </div>
                <div>
                    <p className="text-sm mb-xs bg-neutral-strong text-neutral-light px-xs-plus py-xs rounded inline-block">
                        Hover
                    </p>
                    <SegmentedControl
                        items={items}
                        value={value}
                        onChange={setValue}
                        variant="accent"
                    />
                </div>
            </div>
        );
    }
};

export const StatesGhost: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="bg-neutral-xstrong p-md rounded-md">
                <div className="space-y-md">
                    <div>
                        <p className="text-sm mb-xs text-neutral-light">Default</p>
                        <SegmentedControl
                            items={items}
                            value={value}
                            onChange={setValue}
                            variant="ghost"
                        />
                    </div>
                    <div>
                        <p className="text-sm mb-xs bg-neutral-light text-neutral-strong px-xs-plus py-xs rounded inline-block">
                            Active
                        </p>
                        <SegmentedControl
                            items={items}
                            value="item1"
                            onChange={() => {}}
                            variant="ghost"
                        />
                    </div>
                    <div>
                        <p className="text-sm mb-xs bg-neutral-light text-neutral-strong px-xs-plus py-xs rounded inline-block">
                            Enabled
                        </p>
                        <SegmentedControl
                            items={items}
                            value={value}
                            onChange={setValue}
                            variant="ghost"
                        />
                    </div>
                    <div>
                        <p className="text-sm mb-xs bg-neutral-light text-neutral-strong px-xs-plus py-xs rounded inline-block">
                            Hover
                        </p>
                        <SegmentedControl
                            items={items}
                            value={value}
                            onChange={setValue}
                            variant="ghost"
                        />
                    </div>
                </div>
            </div>
        );
    }
};

export const SizeSmall: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return <SegmentedControl items={items} value={value} onChange={setValue} size="sm" />;
    }
};

export const SizeMedium: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return <SegmentedControl items={items} value={value} onChange={setValue} size="md" />;
    }
};

export const WithFormComponent: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="space-y-lg max-w-md">
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

