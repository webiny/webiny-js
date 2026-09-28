import React from "react";
import { useDrag, DragPreviewImage } from "react-dnd";
import { DropdownMenu, IconButton, Tooltip, cn } from "@webiny/admin-ui";
import { ReactComponent as DragIndicatorIcon } from "@webiny/icons/drag_indicator.svg";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

export const DASHBOARD_WIDGET_DND_TYPE = "dashboard-widget";

interface DragItem {
    name: string;
}

// Transparent 1px gif. Hides the browser's drag preview so DashboardDragLayer's card is the only one.
export const EMPTY_DRAG_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface DashboardWidgetCardProps {
    name: string;
    isDragging: boolean;
    presenter: DashboardLayoutPresenter.Interface;
    /** Reports the card's DOM node to the column so it can measure drop slots. */
    registerRef: (name: string, node: HTMLElement | null) => void;
    children: React.ReactNode;
}

export const DashboardWidgetCard = ({
    name,
    isDragging,
    presenter,
    registerRef,
    children
}: DashboardWidgetCardProps) => {
    const [, drag, preview] = useDrag({
        type: DASHBOARD_WIDGET_DND_TYPE,
        item: () => {
            presenter.beginDrag(name);
            return { name } satisfies DragItem;
        },
        end: () => {
            presenter.endDrag();
        }
    });

    return (
        <>
            <DragPreviewImage connect={preview} src={EMPTY_DRAG_IMAGE} />
            <div
                ref={node => registerRef(name, node)}
                className={cn(
                    "group relative rounded-lg transition-opacity",
                    isDragging && "opacity-50 outline-dashed outline-2 outline-neutral-strong/40"
                )}
            >
                {/*
                    Straddles the card's top edge instead of sitting in its header row, because
                    widgets put their own actions there (e.g. "View All").
                */}
                <div
                    className={
                        "absolute -top-md right-md z-10 flex gap-xxs rounded-md border-sm " +
                        "border-neutral-dimmed bg-neutral-base p-xxs opacity-0 shadow-sm " +
                        "transition-opacity group-hover:opacity-100 focus-within:opacity-100 " +
                        "has-[[data-state=open]]:opacity-100"
                    }
                >
                    <Tooltip
                        content={"Drag to move"}
                        trigger={
                            <span
                                ref={node => {
                                    drag(node);
                                }}
                                className={"cursor-grab active:cursor-grabbing"}
                            >
                                <IconButton
                                    variant={"ghost"}
                                    size={"xs"}
                                    icon={<DragIndicatorIcon />}
                                    aria-label={`Drag ${name}`}
                                />
                            </span>
                        }
                    />
                    <DropdownMenu
                        trigger={
                            <IconButton
                                variant={"ghost"}
                                size={"xs"}
                                icon={<MoreHorizIcon />}
                                aria-label={"More"}
                            />
                        }
                    >
                        <DropdownMenu.Item
                            text={"Remove from dashboard"}
                            onClick={() => presenter.removeWidget(name)}
                        />
                    </DropdownMenu>
                </div>
                {children}
            </div>
        </>
    );
};
