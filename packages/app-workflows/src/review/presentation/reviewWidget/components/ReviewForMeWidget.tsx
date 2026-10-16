import React from "react";
import type { IReviewListUseCases } from "~/review/useCases/IReviewListUseCases.js";
import type { IReviewRowProvider } from "~/review/presentation/reviewList/abstractions.js";
import type { ReviewListTab } from "~/review/presentation/reviewList/abstractions.js";
import { ReviewWidgetCard } from "./ReviewWidgetCard.js";

export interface ReviewForMeWidgetProps {
    useCases: IReviewListUseCases;
    namespaces: string[];
    rowProvider: IReviewRowProvider;
    viewAllUrl: (tab: ReviewListTab) => string;
}

export const ReviewForMeWidget = (props: ReviewForMeWidgetProps) => {
    return <ReviewWidgetCard {...props} kind="forMe" title="For me to review" />;
};
