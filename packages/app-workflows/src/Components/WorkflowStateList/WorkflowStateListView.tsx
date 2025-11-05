import React, { useMemo } from "react";
import type ApolloClient from "apollo-client";
import { useCanUseWorkflows } from "~/hooks/canUseWorkflows.js";
import { Alert } from "@webiny/admin-ui";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/Presenters/index.js";
import { WorkflowStateListProvider } from "./Provider/WorkflowStateListProvider.js";
import { WorkflowStateList } from "~/Components/WorkflowStateList/WorkflowStateList.js";

interface IWorkflowStateListViewProps {
    app?: string;
    client: ApolloClient<object>;
}

export const WorkflowStateListView = (props: IWorkflowStateListViewProps) => {
    const { app, client } = props;

    const where = useMemo<IWorkflowStateListPresenterListParamsWhere | undefined>(() => {
        if (!app) {
            return undefined;
        }
        return {
            app
        };
    }, [app]);

    const canUseWorkflows = useCanUseWorkflows();
    if (!canUseWorkflows) {
        return (
            <Alert type={"danger"} title={"You don't have access to Workflows."}>
                You do not have access to Workflows. Please contact your system administrator.
            </Alert>
        );
    }

    return (
        <WorkflowStateListProvider client={client} where={where}>
            <WorkflowStateList />
        </WorkflowStateListProvider>
    );
};
