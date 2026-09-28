import React from "react";
import { useDrop } from "react-dnd";
import { Icon } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as AddIcon } from "@webiny/icons/add.svg";
import { DASHBOARD_WIDGET_DND_TYPE } from "./DashboardWidgetCard.js";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

interface NewColumnDropZoneProps {
    visible: boolean;
    active: boolean;
    presenter: DashboardLayoutPresenter.Interface;
}

const SHOWN_CLASSES = "pointer-events-auto ml-lg w-[92px] border-sm opacity-100";
const HIDDEN_CLASSES = "pointer-events-none w-0 border-0 opacity-0";
const ACTIVE_CLASSES = "border-primary bg-primary/15 text-primary";
const IDLE_CLASSES = "border-primary/50 bg-primary/5 text-primary/80";

/**
 * Slot after the last column. Dropping a widget here creates a new column.
 * Always mounted (so the HTML5 backend registers it before a drag starts), but it only takes up
 * room while dragging. The columns narrow to make space for it, so it's never pushed off-screen.
 */
export const NewColumnDropZone = ({ visible, active, presenter }: NewColumnDropZoneProps) => {
    const [, drop] = useDrop({
        accept: DASHBOARD_WIDGET_DND_TYPE,
        hover: () => {
            presenter.hoverNewColumn();
        },
        drop: () => {
            presenter.drop();
        }
    });

    return (
        <div
            ref={node => {
                drop(node);
            }}
            className={cn(
                "flex min-h-[260px] flex-none self-start flex-col items-center justify-center gap-xs",
                "overflow-hidden rounded-lg border-dashed text-center text-sm font-semibold",
                "transition-[opacity,background-color,border-color]",
                visible ? SHOWN_CLASSES : HIDDEN_CLASSES,
                active ? ACTIVE_CLASSES : IDLE_CLASSES
            )}
        >
            <Icon icon={<AddIcon />} label={"New column"} size={"sm"} color={"accent"} />
            <span>
                {"New"}
                <br />
                {"column"}
            </span>
        </div>
    );
};
