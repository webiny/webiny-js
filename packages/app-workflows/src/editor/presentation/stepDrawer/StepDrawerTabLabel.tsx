import React from "react";
import { Tag } from "@webiny/admin-ui";
import { STEP_DRAWER_MESSAGES } from "./stepDrawerMessages.js";

export interface StepDrawerTabLabelProps {
    label: string;
    errorCount: number;
}

/*
 * A step drawer tab label with the count of its field errors in a tag (B23). The tag is hidden
 * from screen readers; a visually hidden suffix names the tab "Assignment, 2 errors" instead.
 */
export const StepDrawerTabLabel = ({ label, errorCount }: StepDrawerTabLabelProps) => {
    if (errorCount === 0) {
        return <>{label}</>;
    }

    // One hidden text names the tab. A label followed by a visually hidden suffix reads
    // "Assignment , 2 errors": browsers put a space before an absolutely positioned element.
    return (
        <span className={"inline-flex items-center gap-xs"}>
            <span aria-hidden={"true"} className={"inline-flex items-center gap-xs"}>
                {label}
                <span data-role={"step-tab-error-count"}>
                    <Tag variant={"destructive-light"} content={String(errorCount)} />
                </span>
            </span>
            <span className={"sr-only"}>
                {label}
                {STEP_DRAWER_MESSAGES.tabErrorCount(errorCount)}
            </span>
        </span>
    );
};
