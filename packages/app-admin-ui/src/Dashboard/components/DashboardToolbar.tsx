import React from "react";
import { Button } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { ReactComponent as RestartAltIcon } from "@webiny/icons/restart_alt.svg";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { ReactComponent as DashboardCustomizeIcon } from "@webiny/icons/dashboard_customize.svg";
import { ReactComponent as CheckIcon } from "@webiny/icons/check.svg";
import { ColumnCountControl } from "./dnd/ColumnCountControl.js";
import type { DashboardLayoutPresenter } from "../dashboardLayout/presenter/abstractions.js";

interface DashboardToolbarProps {
    vm: DashboardLayoutPresenter.ViewModel;
    // Customize mode is on and every chosen column fits on screen.
    editing: boolean;
    // Every chosen column fits on screen, so Customize mode can be offered.
    canCustomize: boolean;
    presenter: DashboardLayoutPresenter.Interface;
    onAddWidget: () => void;
}

// Top-right controls: one "Customize" button normally, the full editing set in Customize mode.
export const DashboardToolbar = ({
    vm,
    editing,
    canCustomize,
    presenter,
    onAddWidget
}: DashboardToolbarProps) => {
    if (editing) {
        return (
            <>
                <ColumnCountControl
                    columnCount={vm.columnCount}
                    disabled={vm.draggingName !== null}
                    presenter={presenter}
                />
                <Tooltip
                    content={"Reset to default layout"}
                    trigger={
                        <IconButton
                            variant={"tertiary"}
                            size={"md"}
                            icon={<RestartAltIcon />}
                            aria-label={"Reset to default layout"}
                            onClick={() => presenter.resetToDefault()}
                        />
                    }
                />
                <Button
                    variant={"tertiary"}
                    text={"Add widget"}
                    icon={<AddIcon />}
                    onClick={onAddWidget}
                />
                <Button
                    variant={"primary"}
                    text={"Done"}
                    icon={<CheckIcon />}
                    onClick={() => presenter.stopEditing()}
                />
            </>
        );
    }

    let hint = "Rearrange, add or remove widgets";
    if (!canCustomize) {
        hint = "Make the window wider to customize the dashboard";
    }

    return (
        <Tooltip
            content={hint}
            trigger={
                <Button
                    variant={"tertiary"}
                    text={"Customize"}
                    icon={<DashboardCustomizeIcon />}
                    disabled={!canCustomize}
                    onClick={() => presenter.startEditing()}
                />
            }
        />
    );
};
