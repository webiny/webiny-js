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
import { formatDate } from "~/admin/components/utils";
import { PanelBox } from "./Styled";
import { ContentReviewStep } from "./ContentReviewStep";
import { PublishContent } from "./ContentReviewStep/PublishContent";

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
    padding: 0;
    overflow: auto;
    height: calc(100vh - 64px - 56px);
`;

interface LeftPanelProps {
    steps: ApwContentReviewStep[];
    reviewRequestedOn: string;
    reviewRequestedBy: CreatedBy;
    status: ApwContentReviewStatus;
}

export const LeftPanel: React.FC<LeftPanelProps> = ({
    status,
    steps,
    reviewRequestedBy,
    reviewRequestedOn
}) => {
    return (
        <PanelBox flex={"1 1 26%"}>
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
            <PublishContent status={status} />
        </PanelBox>
    );
};
