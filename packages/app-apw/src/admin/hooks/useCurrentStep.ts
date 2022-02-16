import { useMemo } from "react";
import { useContentReview } from "~/admin/views/contentReviewDashboard/hooks/useContentReview";
import { useContentReviewId, useCurrentStepId } from "./useContentReviewId";
import { ApwContentReviewStep } from "~/types";

interface UseCurrentStepResult {
    currentStep: ApwContentReviewStep;
    changeRequestsPending: boolean;
}

export const useCurrentStep = (): UseCurrentStepResult => {
    const { id } = useContentReviewId();
    const { id: stepId } = useCurrentStepId();
    const { contentReview } = useContentReview({ id });

    const currentStep = useMemo(() => {
        if (contentReview && Array.isArray(contentReview.steps)) {
            return contentReview.steps.find(step => step.id === stepId);
        }
        return null;
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
