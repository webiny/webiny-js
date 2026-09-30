import React from "react";
import { useDrag } from "react-dnd";
import { DragPreviewImage } from "react-dnd";
import { IconButton } from "@webiny/admin-ui";
import { Tooltip } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as CloseIcon } from "@webiny/icons/close.svg";
import type { DashboardLayoutPresenter } from "../../dashboardLayout/presenter/abstractions.js";

export const DASHBOARD_WIDGET_DND_TYPE = "dashboard-widget";

interface DragItem {
    name: string;
}

// Transparent 1px gif. Hides the browser's drag preview so DashboardDragLayer's card is the only one.
const EMPTY_DRAG_IMAGE =
    "data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==";

interface DashboardWidgetCardProps {
    name: string;
    title: string;
    isDragging: boolean;
    presenter: DashboardLayoutPresenter.Interface;
    /** Reports the card's DOM node to the column so it can measure drop slots. */
    registerRef: (name: string, node: HTMLElement | null) => void;
    children: React.ReactNode;
}

/*
 * A widget in Customize mode. The whole card is the drag target: an overlay covers the widget, so
 * its own links and buttons can't catch the pointer, and a remove button sits in the corner.
 */
export const DashboardWidgetCard = ({
    name,
    title,
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
                className={cn("relative rounded-xl transition-opacity", isDragging && "opacity-50")}
            >
                {/*
                    `inert` keeps the widget out of the tab order and away from clicks. It's set
                    through a ref because React 18's types don't know the attribute yet.
                */}
                <div ref={node => node?.setAttribute("inert", "")} className={"select-none"}>
                    {children}
                </div>
                <div
                    ref={node => {
                        drag(node);
                    }}
                    role={"button"}
                    aria-label={`Drag ${title} to move it`}
                    data-testid={`dashboard-card-${name}`}
                    className={cn(
                        // `rounded-xl` matches the DS Widget, so the outline follows its corners.
                        "absolute inset-0 z-10 cursor-grab rounded-xl active:cursor-grabbing",
                        "ring-2 ring-inset ring-primary/30 transition-colors",
                        "hover:bg-primary/5 hover:ring-primary/60"
                    )}
                />
                {/* On the corner, half outside the card, so it never covers the widget's own actions. */}
                <div className={"absolute -right-sm -top-sm z-20"}>
                    <Tooltip
                        content={"Remove from dashboard"}
                        trigger={
                            <IconButton
                                variant={"tertiary"}
                                size={"sm"}
                                icon={<CloseIcon />}
                                aria-label={`Remove ${title} from the dashboard`}
                                onClick={() => presenter.removeWidget(name)}
                            />
                        }
                    />
                </div>
            </div>
        </>
    );
};
