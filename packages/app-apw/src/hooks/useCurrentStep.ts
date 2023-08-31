import { useMemo } from "react";
import { useContentReview } from "~/hooks/useContentReview";
import { useContentReviewId, useCurrentStepId } from "./useContentReviewId";
import { ApwContentReviewStep } from "~/types";
import { useInterval } from "react-interval-hook";

interface UseCurrentStepResult {
    currentStep: ApwContentReviewStep | null;
    changeRequestsPending: boolean;
}

const CONTENT_REVIEW_REFRESH_INTERVAL = 10000; // 10s

export const useCurrentStep = (): UseCurrentStepResult => {
    const contentReviewId = useContentReviewId();
    if (!contentReviewId) {
        return {
            currentStep: null,
            changeRequestsPending: false
        };
    }
    const { id: stepId } = useCurrentStepId();
    const { contentReview, refetch } = useContentReview({ id: contentReviewId.id });

    useInterval(() => {
        refetch();
    }, CONTENT_REVIEW_REFRESH_INTERVAL);

    const currentStep = useMemo(() => {
        let currentStep;
        if (contentReview && Array.isArray(contentReview.steps)) {
            currentStep = contentReview.steps.find(step => step.id === stepId);
        }
        return currentStep || null;
    }, [contentReview, stepId]);

    const changeRequestsPending = useMemo(() => {
        if (contentReview && Array.isArray(contentReview.steps)) {
            return contentReview.steps.some(step => step.pendingChangeRequests !== 0);
        }
        return true;
    }, [contentReview, stepId]);

    return {
        currentStep,
        changeRequestsPending
    };
};
