import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as DashboardCustomizeIcon } from "@webiny/icons/dashboard_customize.svg";
import { ReactComponent as AddCircleIcon } from "@webiny/icons/add_circle.svg";

interface ColumnEmptyStateProps {
    canRemove: boolean;
    onRemove: () => void;
    onBrowse: () => void;
    // A widget is being dragged somewhere on the dashboard.
    dragging: boolean;
    // ...and it's over this column.
    active: boolean;
}

const IDLE_CLASSES = "border-neutral-strong/40 bg-neutral-base/50 hover:border-neutral-strong/60";
const CAN_DROP_CLASSES = "border-primary/50 bg-primary/5";
const ACTIVE_CLASSES = "border-primary bg-primary/10";

export const ColumnEmptyState = ({
    canRemove,
    onRemove,
    onBrowse,
    dragging,
    active
}: ColumnEmptyStateProps) => {
    let stateClasses = IDLE_CLASSES;
    if (active) {
        stateClasses = ACTIVE_CLASSES;
    } else if (dragging) {
        stateClasses = CAN_DROP_CLASSES;
    }

    let icon = (
        <Icon
            icon={<DashboardCustomizeIcon />}
            label={"Empty column"}
            size={"sm"}
            color={"neutral-strong"}
        />
    );
    if (dragging) {
        icon = <Icon icon={<AddCircleIcon />} label={"Drop here"} size={"sm"} color={"accent"} />;
    }

    let body = (
        <>
            <Text as={"div"} size={"sm"} className={"text-center text-neutral-strong"}>
                {"Drop a widget here"}
                <br />
                {"or "}
                <button
                    type={"button"}
                    onClick={onBrowse}
                    className={"cursor-pointer text-primary hover:underline"}
                >
                    {"browse widgets"}
                </button>
            </Text>
            {canRemove && (
                <Button size={"sm"} variant={"ghost"} text={"Remove column"} onClick={onRemove} />
            )}
        </>
    );
    if (dragging) {
        body = (
            <Text as={"div"} size={"sm"} className={"text-center text-primary"}>
                {"Drop it here"}
            </Text>
        );
    }

    return (
        <div
            data-testid={"dashboard-empty-column"}
            className={cn(
                // `rounded-xl` and the 2px border match the cards' outline and the drop slot.
                "flex min-h-[220px] flex-col items-center justify-center gap-sm rounded-xl",
                "border-2 border-dashed p-lg transition-colors",
                stateClasses
            )}
        >
            <span
                className={cn(
                    "flex size-xl items-center justify-center rounded-md",
                    dragging ? "bg-primary/10" : "bg-neutral-dimmed"
                )}
            >
                {icon}
            </span>
            {body}
        </div>
    );
};
