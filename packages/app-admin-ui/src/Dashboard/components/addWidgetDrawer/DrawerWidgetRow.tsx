import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import type { DrawerWidget } from "./types.js";
import { AddToColumnMenu } from "./AddToColumnMenu.js";
import { WidgetPreviewFrame } from "./WidgetPreviewFrame.js";

interface DrawerWidgetRowProps {
    widget: DrawerWidget;
    columnCount: number;
    presenter: DashboardLayoutPresenter.Interface;
}

export const DrawerWidgetRow = ({ widget, columnCount, presenter }: DrawerWidgetRowProps) => {
    let action = (
        <AddToColumnMenu widget={widget} columnCount={columnCount} presenter={presenter} />
    );
    if (widget.added) {
        action = <Button size={"sm"} variant={"tertiary"} text={"Added"} disabled={true} />;
    }

    return (
        <div
            className={"flex flex-col gap-sm rounded-md border-sm border-neutral-muted p-sm-extra"}
        >
            <WidgetPreviewFrame preview={widget.preview} added={widget.added} />
            <div className={"flex items-start gap-md"}>
                <div className={"min-w-0 flex-1"}>
                    <Text as={"div"} size={"md"} className={"font-semibold"}>
                        {widget.title}
                    </Text>
                    {widget.description && (
                        <Text as={"div"} size={"sm"} className={"mt-xxs text-neutral-strong"}>
                            {widget.description}
                        </Text>
                    )}
                </div>
                {action}
            </div>
        </div>
    );
};
