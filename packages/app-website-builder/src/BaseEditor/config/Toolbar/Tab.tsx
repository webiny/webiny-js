import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";

export interface TabProps {
    name: string;
    label: string;
    icon?: React.ReactElement;
    element: React.JSX.Element;
    disabled?: boolean;
    visible?: boolean;
}

export const Tab = ({ name, label, icon, element, disabled, visible }: TabProps) => (
    <SegmentedControl.Tabs.Tab
        value={name}
        trigger={label}
        icon={icon}
        disabled={disabled}
        visible={visible}
        content={element}
    />
);
