import React from "react";
import type { IIdentity } from "~/types.js";
import type ApolloClient from "apollo-client";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import { WorkflowStatesWidgetView } from "./WorkflowStatesWidgetView.js";

interface IWorkflowStatesWidgetProps {
    identity: IIdentity;
    client: ApolloClient<object>;
}

export const WorkflowStatesWidget = (props: IWorkflowStatesWidgetProps) => {
    const { identity, client } = props;

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }

    return <WorkflowStatesWidgetView identity={identity} client={client} />;
};
