import React from "react";
import type ApolloClient from "apollo-client";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStatesProvider } from "./Provider/WorkflowStatesProvider.js";
import { WorkflowStateWidgetCard } from "./Card/WorkflowStatesWidgetCard.js";
import { WorkflowStateValue } from "~/types.js";

export interface IWorkflowStatesOwnWidgetProps {
    client: ApolloClient<object>;
}

export const WorkflowStatesOwnWidget = (props: IWorkflowStatesOwnWidgetProps) => {
    const { client } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Content Reviews."}>
                You do not have access to Content Reviews. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <WorkflowStatesProvider
            type={"own"}
            client={client}
            states={[
                WorkflowStateValue.pending,
                WorkflowStateValue.inReview,
                WorkflowStateValue.approved,
                WorkflowStateValue.rejected
            ]}
        >
            <WorkflowStateWidgetCard
                title={
                    <span>
                        <span className={"text-accent-primary"}>Content Reviews</span> assigned by
                        me
                    </span>
                }
            />
        </WorkflowStatesProvider>
    );
};
