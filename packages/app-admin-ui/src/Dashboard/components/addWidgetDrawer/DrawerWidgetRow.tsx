import React from "react";
import { Button } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";
import type { DrawerWidget } from "./types.js";
import { AddToColumnMenu } from "./AddToColumnMenu.js";

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
            className={
                "flex items-start gap-md rounded-md border-sm border-neutral-muted p-sm-extra"
            }
        >
            <WidgetThumbnail added={widget.added} />
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
    );
};

// A tiny sketch of a widget card: header, two lines of text and a button.
const WidgetThumbnail = ({ added }: { added: boolean }) => {
    return (
        <div
            aria-hidden
            className={cn(
                "flex h-[58px] w-[84px] flex-none flex-col gap-xxs overflow-hidden rounded-sm",
                "border-sm border-neutral-muted bg-neutral-light p-xs"
            )}
        >
            <div className={"flex items-center gap-[3px]"}>
                <span
                    className={cn(
                        "size-[7px] rounded-[2px]",
                        added ? "bg-neutral-strong" : "bg-primary"
                    )}
                />
                <span className={"h-[4px] w-[30px] rounded-[2px] bg-neutral-strong/40"} />
            </div>
            <span className={"h-[4px] w-full rounded-[2px] bg-neutral-muted"} />
            <span className={"h-[4px] w-3/4 rounded-[2px] bg-neutral-muted"} />
            <span className={"mt-[2px] h-[12px] w-[40px] rounded-[3px] bg-neutral-dimmed"} />
        </div>
    );
};
