import React from "react";
import type { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";

export interface StepDropIndicatorProps {
    edge: SortablePresenter.Edge;
}

/*
 * The line that shows where a dragged step lands: on the top or the bottom edge of the step under
 * the pointer. Same line as the sortable object field items of app-admin. Its parent must be
 * `relative`.
 */
export const StepDropIndicator = (props: StepDropIndicatorProps) => {
    let position = "top-0 -translate-y-1/2";
    if (props.edge === "bottom") {
        position = "bottom-0 translate-y-1/2";
    }
    return (
        <div
            data-role="drop-indicator"
            data-edge={props.edge}
            aria-hidden="true"
            className={`pointer-events-none absolute inset-x-0 z-10 ${position}`}
        >
            <div className="h-[2px] w-full rounded-full bg-primary" />
        </div>
    );
};
