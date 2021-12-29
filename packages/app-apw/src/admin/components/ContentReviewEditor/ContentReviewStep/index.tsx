import React from "react";
import { i18n } from "@webiny/app/i18n";
import { ApwContentReviewStep, ApwContentReviewStepStatus } from "~/types";
import { Box, Columns, Stack } from "~/admin/components/Layout";
import {
    BadgeBox,
    PanelListItem,
    TypographyBody,
    TypographySecondary,
    TypographyTitle
} from "../Styled";

const t = i18n.ns("app-apw/admin/content-reviews/editor");

interface CircleProps {
    outerFillColor: string;
    innerFillColor?: string;
}

const ConcentricCircle: React.FC<CircleProps> = ({
    innerFillColor = "var(--mdc-theme-surface)",
    outerFillColor
}) => {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <circle cx="8" cy="8" r="8" fill={outerFillColor} />
            <circle cx="8" cy="8" r="3" fill={innerFillColor} />
        </svg>
    );
};

interface StepStatusIconProps {
    status: ApwContentReviewStepStatus;
}

const fillColor = {
    [ApwContentReviewStepStatus.DONE]: "var(--mdc-theme-secondary)",
    [ApwContentReviewStepStatus.ACTIVE]: "var(--mdc-theme-primary)",
    [ApwContentReviewStepStatus.INACTIVE]: "var(--mdc-theme-text-secondary-on-background)"
};

const StepStatusIcon: React.FC<StepStatusIconProps> = ({ status }) => {
    return <ConcentricCircle outerFillColor={fillColor[status]} />;
};

interface ContentReviewStepProps {
    step: ApwContentReviewStep;
    createdBy?: {
        displayName: string;
    };
    createdOn?: string;
}

const Index: React.FC<ContentReviewStepProps> = ({ step, createdOn, createdBy }) => {
    return (
        <PanelListItem selected={step.status === ApwContentReviewStepStatus.ACTIVE}>
            <Columns space={3}>
                <Box paddingTop={1}>
                    <StepStatusIcon status={step.status} />
                </Box>
                <Stack space={0}>
                    <Box>
                        <TypographyTitle use={"subtitle1"}>{step.title}</TypographyTitle>
                    </Box>
                    {createdOn && (
                        <Box>
                            <TypographyBody use={"caption"}>By:&nbsp;&nbsp;</TypographyBody>
                            <TypographySecondary use={"caption"}>
                                {t`{author} on {createdOn}`({
                                    author: createdBy.displayName,
                                    createdOn
                                })}
                            </TypographySecondary>
                        </Box>
                    )}
                    {step.status === ApwContentReviewStepStatus.ACTIVE && (
                        <>
                            <Columns space={2.5} alignItems={"center"}>
                                <Box>
                                    <TypographyBody
                                        use={"caption"}
                                    >{t`Pending change request: `}</TypographyBody>
                                </Box>
                                <BadgeBox paddingX={1.5}>
                                    <span>{step.pendingChangeRequests}</span>
                                </BadgeBox>
                            </Columns>
                            <Columns space={2.5} alignItems={"center"}>
                                <Box>
                                    <TypographyBody use={"caption"}>{t`Sign off: `}</TypographyBody>
                                </Box>
                                <BadgeBox paddingX={1.5}>
                                    <span>
                                        {step.signOffProvidedOn === null ? "pending" : "provided"}
                                    </span>
                                </BadgeBox>
                            </Columns>
                        </>
                    )}
                </Stack>
            </Columns>
        </PanelListItem>
    );
};

export default Index;
