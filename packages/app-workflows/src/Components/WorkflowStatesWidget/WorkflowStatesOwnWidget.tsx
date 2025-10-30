import React from "react";
import type ApolloClient from "apollo-client";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStatesProvider } from "./Provider/WorkflowStatesProvider.js";
import { WorkflowStateWidgetCard } from "./Card/WorkflowStatesWidgetCard.js";

interface IWorkflowStatesOwnWidgetProps {
    client: ApolloClient<object>;
}

export const WorkflowStatesOwnWidget = (props: IWorkflowStatesOwnWidgetProps) => {
    const { client } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <WorkflowStatesProvider type={"own"} client={client}>
            <WorkflowStateWidgetCard title={<>Workflow States requested by current user</>} />
        </WorkflowStatesProvider>
    );
};
