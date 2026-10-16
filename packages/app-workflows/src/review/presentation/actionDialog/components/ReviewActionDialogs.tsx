import React from "react";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialogHost } from "./ReviewActionDialogHost.js";

export interface ReviewActionDialogsProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest | null;
    reviewsUrl: string | null;
    /** Set by Content Reviews, which refreshes its list behind a conflicting Start (QBZ-31). */
    listRefreshed?: boolean;
    onDone: () => void;
    onClose: () => void;
}

/** Mounts the dialog of the requested action; nothing without a request. */
export const ReviewActionDialogs = (props: ReviewActionDialogsProps) => {
    const { request } = props;
    if (request === null) {
        return null;
    }

    const key = `${request.kind}:${request.reviewId}:${request.stepId}`;
    return <ReviewActionDialogHost key={key} {...props} request={request} />;
};
