import React from "react";
import styled from "@emotion/styled";
import { List } from "@webiny/ui/List";
import {
    ApwContentReviewStatus,
    ApwContentReviewStep,
    ApwContentReviewStepStatus,
    ApwWorkflowStepTypes,
    CreatedBy
} from "~/types";
import { formatDate } from "~/utils";
import { PanelBox } from "./Styled";
import { ContentReviewStep } from "./ContentReviewStep";
import { ChangeContentStatus } from "./ChangeContentStatus";

const ReviewRequestedStepData = {
    id: "123",
    title: "Review requested",
    type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
    reviewers: [],
    pendingChangeRequests: 0,
    signOffProvidedOn: null,
    status: ApwContentReviewStepStatus.DONE
};

const ContentReviewStepList = styled(List)`
    flex: 1 0 0;
    padding: 0;
    overflow: auto;
`;

interface LeftPanelProps {
    steps: ApwContentReviewStep[];
    reviewRequestedOn: string;
    reviewRequestedBy: CreatedBy;
    status: ApwContentReviewStatus;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
    steps,
    reviewRequestedBy,
    reviewRequestedOn
}) => {
    return (
        <PanelBox flex={"1 1 26%"} display={"flex"} style={{ flexDirection: "column" }}>
            <ContentReviewStepList>
                <ContentReviewStep
                    disabled={true}
                    step={ReviewRequestedStepData}
                    createdOn={formatDate(reviewRequestedOn)}
                    createdBy={reviewRequestedBy}
                />
                {steps.map((step, index) => (
                    <ContentReviewStep
                        key={index}
                        step={step}
                        disabled={step.status === ApwContentReviewStepStatus.INACTIVE}
                    />
                ))}
            </ContentReviewStepList>
            <ChangeContentStatus />
        </PanelBox>
    );
};
