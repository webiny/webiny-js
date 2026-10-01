import React from "react";
import { Icon } from "@webiny/admin-ui";
import { ToggleGroup } from "@webiny/admin-ui";
import { ReactComponent as TwoColumnsIcon } from "@webiny/icons/view_column_2.svg";
import { ReactComponent as ThreeColumnsIcon } from "@webiny/icons/view_column.svg";
import { ReactComponent as FourColumnsIcon } from "@webiny/icons/view_column_4.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

interface ColumnCountControlProps {
    columnCount: number;
    disabled?: boolean;
    presenter: DashboardLayoutPresenter.Interface;
}

// Covers MIN_COLUMN_COUNT..MAX_COLUMN_COUNT; add an icon here if that range grows.
// `Icon`'s label is what gives each icon-only toggle an accessible name.
const ITEMS = [
    {
        value: "2",
        icon: <Icon icon={<TwoColumnsIcon />} label={"2 columns"} size={"sm"} />,
        tooltip: "2 columns"
    },
    {
        value: "3",
        icon: <Icon icon={<ThreeColumnsIcon />} label={"3 columns"} size={"sm"} />,
        tooltip: "3 columns"
    },
    {
        value: "4",
        icon: <Icon icon={<FourColumnsIcon />} label={"4 columns"} size={"sm"} />,
        tooltip: "4 columns"
    }
];

export const ColumnCountControl = ({
    columnCount,
    disabled,
    presenter
}: ColumnCountControlProps) => {
    return (
        <ToggleGroup
            type={"single"}
            variant={"ghost"}
            size={"sm"}
            bordered={true}
            items={ITEMS}
            value={String(columnCount)}
            disabled={disabled}
            onChange={value => {
                // Clicking the active option would clear it; a count is always required.
                if (value) {
                    const count = Number(value);
                    presenter.setColumnCount(count);
                }
            }}
        />
    );
};
