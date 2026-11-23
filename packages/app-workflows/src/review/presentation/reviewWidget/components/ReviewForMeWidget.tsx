import React from "react";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { ReactComponent as RateReviewIcon } from "@webiny/icons/rate_review.svg";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewForMeWidgetProps {
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (scope: ReviewListScope, state: ReviewListState) => string;
}

export const ReviewForMeWidget = (props: ReviewForMeWidgetProps) => {
    return (
        <ReviewWidgetCard
            {...props}
            kind="forMe"
            title="For me to review"
            icon={<RateReviewIcon />}
        />
    );
};
