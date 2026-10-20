import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { ReassignDialogPresenterFeature } from "../reassignFeature.js";
import type { ReviewActionRequest } from "../ReviewActionRequest.js";
import { ReassignDialog } from "./ReassignDialog.js";

export interface ReassignDialogHostProps {
    namespace: string;
    request: ReviewActionRequest;
    reviewsUrl: string | null;
    listRefreshed?: boolean;
    onConflict?: () => void;
    onDone: () => void;
    onClose: () => void;
}

// One presenter, with its private picker, per mounted dialog (transient, R212).
export const ReassignDialogHost = (props: ReassignDialogHostProps) => {
    const { namespace, request, reviewsUrl, listRefreshed, onConflict, onDone, onClose } = props;
    const { presenter } = useFeature(ReassignDialogPresenterFeature);

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

    return <ReassignDialog presenter={presenter} />;
};
