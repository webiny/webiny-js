import { useMemo } from "react";
import { useContentReview } from "~/hooks/useContentReview";
import { useContentReviewId, useCurrentStepId } from "./useContentReviewId";
import { ApwContentReviewStep } from "~/types";
import { useFetchInterval } from "~/hooks/useFetchInterval";

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
    const { contentReview, refetch, loading } = useContentReview({
        id: contentReviewId.id
    });

    useFetchInterval({
        callback: refetch,
        interval: CONTENT_REVIEW_REFRESH_INTERVAL,
        loading
    });

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
