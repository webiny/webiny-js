import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { ReactComponent as ExpandMoreIcon } from "@webiny/icons/expand_more.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import type { DrawerWidget } from "./types.js";

interface AddToColumnMenuProps {
    widget: DrawerWidget;
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

// One item per current column; the widget lands at the bottom of the chosen one.
export const AddToColumnMenu = ({ widget, columnCount, presenter }: AddToColumnMenuProps) => {
    const columns = Array.from({ length: columnCount }, (_, index) => index);

    return (
        <DropdownMenu
            trigger={
                <Button
                    size={"sm"}
                    variant={"tertiary"}
                    text={"Add"}
                    icon={<ExpandMoreIcon />}
                    iconPosition={"end"}
                />
            }
        >
            <DropdownMenu.Label text={"Add to"} />
            {columns.map(index => {
                let text = `Column ${index + 1}`;
                if (index === widget.defaultColumn) {
                    text = `${text} (default)`;
                }
                return (
                    <DropdownMenu.Item
                        key={index}
                        text={text}
                        onClick={() => presenter.addWidget(widget.name, index)}
                    />
                );
            })}
        </DropdownMenu>
    );
};
