import React from "react";
import styled from "@emotion/styled";
import { List } from "@webiny/ui/List";
import { ApwContentReviewStepStatus, ApwWorkflowStepTypes } from "~/types";
import { PanelBox } from "./Styled";
import ContentReviewStep from "./ContentReviewStep";
import PublishContent from "./ContentReviewStep/PublishContent";

const MOCK_STEPS = [
    {
        title: "Legal review",
        type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
        reviewers: [],
        pendingChangeRequests: 0,
        signOffProvidedOn: null,
        status: ApwContentReviewStepStatus.ACTIVE
    },
    {
        title: "Marketing review",
        type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
        reviewers: [],
        pendingChangeRequests: 0,
        signOffProvidedOn: null,
        status: ApwContentReviewStepStatus.INACTIVE
    },
    {
        title: "Designer review",
        type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
        reviewers: [],
        pendingChangeRequests: 0,
        signOffProvidedOn: null,
        status: ApwContentReviewStepStatus.INACTIVE
    }
];

const ContentReviewStepList = styled(List)`
    padding: 0;
    overflow: auto;
    height: calc(100vh - 64px - 56px);
`;

const LeftPanel = () => {
    return (
        <PanelBox flex={"1 1 26%"}>
            <ContentReviewStepList>
                <ContentReviewStep
                    step={{
                        title: "Review requested",
                        type: ApwWorkflowStepTypes.MANDATORY_BLOCKING,
                        reviewers: [],
                        pendingChangeRequests: 0,
                        signOffProvidedOn: null,
                        status: ApwContentReviewStepStatus.DONE
                    }}
                    createdOn={"Dec 15th 2021"}
                    createdBy={{
                        displayName: "Sven"
                    }}
                />
                {MOCK_STEPS.map((step, index) => (
                    <ContentReviewStep key={index} step={step} />
                ))}
            </ContentReviewStepList>
            <PublishContent />
        </PanelBox>
    );
};

export default LeftPanel;
