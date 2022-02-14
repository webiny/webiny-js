import React, { useMemo } from "react";
import styled from "@emotion/styled";
import { ButtonIcon, ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { ReactComponent as CheckIcon } from "~/admin/assets/icons/check_24dp.svg";
import { ReactComponent as NotInterestedIcon } from "~/admin/assets/icons/not_interested_24dp.svg";
import { Box } from "~/admin/components/Layout";
import { useStepSignOff } from "~/admin/hooks/useStepSignoff";
import { useContentReview } from "~/admin/views/contentReviewDashboard/hooks/useContentReview";
import { useContentReviewId, useCurrentStepId } from "~/admin/hooks/useContentReviewId";
import { i18n } from "@webiny/app/i18n";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const SignOffBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;
const SignOffButtonStyles = { width: "217px", backgroundColor: "var(--mdc-theme-secondary)" };

export const ProvideSignOff = () => {
    const { id } = useContentReviewId();
    const { id: stepId } = useCurrentStepId();
    const { contentReview } = useContentReview({ id });
    const { provideSignOff, retractSignOff, loading } = useStepSignOff();

    const currentStep = useMemo(() => {
        if (contentReview && Array.isArray(contentReview.steps)) {
            return contentReview.steps.find(step => step.id === stepId);
        }
        return null;
    }, [contentReview, stepId]);

    if (loading) {
        return <CircularProgress label={"Loading"} />;
    }

    if (currentStep && currentStep.signOffProvidedOn) {
        return (
            <SignOffBox paddingX={5}>
                <ButtonDefault onClick={async () => await retractSignOff()}>
                    <ButtonIcon icon={<NotInterestedIcon />} />
                    {t`Retract Sign off`}
                </ButtonDefault>
            </SignOffBox>
        );
    }

    return (
        <SignOffBox paddingX={5}>
            <ButtonPrimary style={SignOffButtonStyles} onClick={async () => await provideSignOff()}>
                <ButtonIcon icon={<CheckIcon />} />
                {t`Provide Sign off`}
            </ButtonPrimary>
        </SignOffBox>
    );
};
