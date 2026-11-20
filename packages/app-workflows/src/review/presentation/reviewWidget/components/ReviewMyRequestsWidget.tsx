import React from "react";
import type { WorkflowAppKind } from "~/domain/WorkflowAppKind.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListScope } from "~/review/domain/ReviewListScope.js";
import type { ReviewListState } from "~/review/domain/ReviewListState.js";
import { ReactComponent as SendIcon } from "@webiny/icons/send.svg";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewMyRequestsWidgetProps {
    app: WorkflowAppKind;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (scope: ReviewListScope, state: ReviewListState) => string;
}

export const ReviewMyRequestsWidget = (props: ReviewMyRequestsWidgetProps) => {
    return (
        <ReviewWidgetCard {...props} kind="myRequests" title="My requests" icon={<SendIcon />} />
    );
};
