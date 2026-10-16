import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialog } from "./ReviewActionDialog.js";

export interface ReviewActionDialogHostProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    listRefreshed?: boolean;
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

// One presenter per mounted dialog (transient, R212): init on mount, dispose on unmount.
export const ReviewActionDialogHost = (props: ReviewActionDialogHostProps) => {
    const { useCases, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReviewActionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({
            useCases,
            request,
            reviewsUrl,
            listRefreshed,
            onConflict,
            onDone,
            onClose
        });
        return () => presenter.dispose();
    }, [presenter, request.kind, request.reviewId, request.stepId]);

    return <ReviewActionDialog presenter={presenter} />;
};
