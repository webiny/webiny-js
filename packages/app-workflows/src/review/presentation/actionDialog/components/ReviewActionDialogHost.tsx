import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { ReviewActionDialogPresenterFeature } from "../feature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReviewActionDialog } from "./ReviewActionDialog.js";

export interface ReviewActionDialogHostProps {
    namespace: string;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    listRefreshed?: boolean;
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

// One presenter per mounted dialog (transient, R212): init on mount, dispose on unmount.
export const ReviewActionDialogHost = (props: ReviewActionDialogHostProps) => {
    const { namespace, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReviewActionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({
            namespace,
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
