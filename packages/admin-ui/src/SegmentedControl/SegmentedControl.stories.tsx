import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react;
import { ReactComponent as LockIcon } from "@webiny/icons/notifications.svg";
import { ReactComponent as PersonIcon } from "@webiny/icons/person.svg";
import { ReactComponent as SettingsIcon } from "@webiny/icons/settings.svg";
import { SegmentedControl } from "./SegmentedControl.js";
import { Icon } from "~/Icon/index.js";
import { Button } from "~/Button/index.js";
import { useSegmentedTabs } from "./SegmentedControlTabsContext.js";

const meta: Meta<typeof SegmentedControl> = {
    title: "Components/Form/SegmentedControl",
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

export const VariantLight: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return <SegmentedControl items={items} value={value} onChange={setValue} variant="light" />;
    }
};

export const VariantDimmed: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <SegmentedControl items={items} value={value} onChange={setValue} variant="dimmed" />
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

export const FullWidth: Story = {
    render: () => {
        const [value, setValue] = useState("item1");

        return (
            <div className="w-[500px]">
                <SegmentedControl items={items} value={value} onChange={setValue} fullWidth />
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

// SegmentedControl.Tabs stories

export const TabsDefault: Story = {
    render: () => (
        <SegmentedControl.Tabs>
            <SegmentedControl.Tabs.Tab
                value={"account"}
                trigger={"Account"}
                icon={<Icon icon={<PersonIcon />} label={"Account"} />}
                content={<div className={"p-md"}>{"Account content"}</div>}
            />
            <SegmentedControl.Tabs.Tab
                value={"security"}
                trigger={"Security"}
                icon={<Icon icon={<LockIcon />} label={"Security"} />}
                content={<div className={"p-md"}>{"Security content"}</div>}
            />
            <SegmentedControl.Tabs.Tab
                value={"preferences"}
                trigger={"Preferences"}
                icon={<Icon icon={<SettingsIcon />} label={"Preferences"} />}
                content={<div className={"p-md"}>{"Preferences content"}</div>}
            />
        </SegmentedControl.Tabs>
    )
};

export const TabsDimmed: Story = {
    render: () => (
        <SegmentedControl.Tabs variant={"dimmed"}>
            <SegmentedControl.Tabs.Tab
                value={"account"}
                trigger={"Account"}
                content={<div className={"p-md"}>{"Account content"}</div>}
            />
            <SegmentedControl.Tabs.Tab
                value={"security"}
                trigger={"Security"}
                content={<div className={"p-md"}>{"Security content"}</div>}
            />
            <SegmentedControl.Tabs.Tab
                value={"preferences"}
                trigger={"Preferences"}
                content={<div className={"p-md"}>{"Preferences content"}</div>}
            />
        </SegmentedControl.Tabs>
    )
};

const SwitchFromContent = () => {
    const { setActiveTab } = useSegmentedTabs();
    return (
        <div className={"p-md flex flex-col gap-sm"}>
            <p>{"Account content"}</p>
            <Button
                variant={"secondary"}
                text={"Go to Security"}
                onClick={() => setActiveTab("security")}
            />
        </div>
    );
};

export const TabsProgrammaticSwitch: Story = {
    render: () => (
        <SegmentedControl.Tabs variant={"dimmed"}>
            <SegmentedControl.Tabs.Tab
                value={"account"}
                trigger={"Account"}
                content={<SwitchFromContent />}
            />
            <SegmentedControl.Tabs.Tab
                value={"security"}
                trigger={"Security"}
                content={<div className={"p-md"}>{"Security content"}</div>}
            />
        </SegmentedControl.Tabs>
    )
};
