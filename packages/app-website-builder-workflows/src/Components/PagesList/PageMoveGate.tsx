import React from "react";
import { ReviewState } from "@webiny/app-workflows/review/domain/ReviewState.js";
import { usePage } from "~/hooks/usePage.js";
import { PageMoveBlocked } from "./PageMoveBlocked.js";

export interface PageMoveGateProps {
    element: React.ReactElement | undefined;
}

// The API refuses to move a page whose review is in progress (`Workflows/Review/TargetLocked`).
export const PageMoveGate = (props: PageMoveGateProps) => {
    const { page } = usePage();

    if (page.workflow?.reviewState === ReviewState.InProgress) {
        return <PageMoveBlocked />;
    }

    return props.element ?? null;
};
