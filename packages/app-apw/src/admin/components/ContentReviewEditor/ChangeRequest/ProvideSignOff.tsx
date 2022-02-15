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
import { Tooltip } from "@webiny/ui/Tooltip";

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

    const changeRequestsPending = useMemo(() => {
        if (contentReview && Array.isArray(contentReview.steps)) {
            return contentReview.steps.some(step => step.pendingChangeRequests !== 0);
        }
        return true;
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

    const disabledButtonTooltip = t`A sign off can only be provided once all change requests have been resolved.`;
    const provideSignOffButtonLabel = t`Provide Sign off`;

    return (
        <SignOffBox paddingX={5}>
            {changeRequestsPending ? (
                <Tooltip content={disabledButtonTooltip}>
                    <ButtonPrimary onClick={async () => await provideSignOff()} disabled={true}>
                        <ButtonIcon icon={<CheckIcon />} />
                        {provideSignOffButtonLabel}
                    </ButtonPrimary>
                </Tooltip>
            ) : (
                <ButtonPrimary
                    style={SignOffButtonStyles}
                    onClick={async () => await provideSignOff()}
                >
                    <ButtonIcon icon={<CheckIcon />} />
                    {provideSignOffButtonLabel}
                </ButtonPrimary>
            )}
        </SignOffBox>
    );
};
