import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { IReviewUseCases } from "~/review/useCases/IReviewUseCases.js";
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReassignDialog } from "./ReassignDialog.js";

export interface ReassignDialogHostProps {
    useCases: IReviewUseCases;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    listRefreshed?: boolean;
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

// One presenter, with its private picker, per mounted dialog (transient, R212).
export const ReassignDialogHost = (props: ReassignDialogHostProps) => {
    const { useCases, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReassignDialogPresenterFeature);

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

    return <ReassignDialog presenter={presenter} />;
};
