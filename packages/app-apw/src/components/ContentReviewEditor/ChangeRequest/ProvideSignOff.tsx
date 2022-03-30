import React from "react";
import styled from "@emotion/styled";
import { ButtonIcon, ButtonPrimary, ButtonDefault } from "@webiny/ui/Button";
import { CircularProgress } from "@webiny/ui/Progress";
import { ReactComponent as CheckIcon } from "~/assets/icons/check_24dp.svg";
import { ReactComponent as NotInterestedIcon } from "~/assets/icons/not_interested_24dp.svg";
import { Box } from "~/components/Layout";
import { useStepSignOff } from "~/hooks/useStepSignoff";
import { i18n } from "@webiny/app/i18n";
import { Tooltip } from "@webiny/ui/Tooltip";
import { ApwContentReviewStep } from "~/types";

const t = i18n.ns("app-apw/content-reviews/editor/steps/changeRequest");

const SignOffBox = styled(Box)`
    display: flex;
    justify-content: center;
    align-items: center;
    height: 56px;
    border-top: 1px solid var(--mdc-theme-background);
`;
const SignOffButtonStyles = { width: "217px", backgroundColor: "var(--mdc-theme-secondary)" };

interface ProvideSignOffProps {
    currentStep: ApwContentReviewStep;
    changeRequestsPending: boolean;
}

export const ProvideSignOff: React.FC<ProvideSignOffProps> = ({
    currentStep,
    changeRequestsPending
}) => {
    const { provideSignOff, retractSignOff, loading } = useStepSignOff();

    if (loading) {
        return <CircularProgress label={"Loading"} />;
    }

    if (currentStep && currentStep.signOffProvidedOn) {
        return (
            <SignOffBox paddingX={5}>
                <ButtonDefault
                    onClick={() => {
                        retractSignOff();
                    }}
                >
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
                    <ButtonPrimary
                        onClick={() => {
                            provideSignOff();
                        }}
                        disabled={true}
                    >
                        <ButtonIcon icon={<CheckIcon />} />
                        {provideSignOffButtonLabel}
                    </ButtonPrimary>
                </Tooltip>
            ) : (
                <ButtonPrimary
                    style={SignOffButtonStyles}
                    onClick={() => {
                        provideSignOff();
                    }}
                >
                    <ButtonIcon icon={<CheckIcon />} />
                    {provideSignOffButtonLabel}
                </ButtonPrimary>
            )}
        </SignOffBox>
    );
};
