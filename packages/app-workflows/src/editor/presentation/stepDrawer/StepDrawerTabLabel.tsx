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

    return (
        <span className={"inline-flex items-center gap-xs"}>
            {/* The suffix sits in the label's own inline box: as a flex item of its own, browsers
                put a space before it and the tab reads "Assignment , 2 errors". */}
            <span>
                {label}
                <span className={"sr-only"}>{STEP_DRAWER_MESSAGES.tabErrorCount(errorCount)}</span>
            </span>
            <span aria-hidden={"true"} data-role={"step-tab-error-count"}>
                <Tag variant={"destructive-light"} content={String(errorCount)} />
            </span>
        </span>
    );
};
