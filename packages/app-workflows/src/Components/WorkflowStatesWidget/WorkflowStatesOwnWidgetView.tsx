import React from "react";
import type ApolloClient from "apollo-client";
import { WorkflowStatesProvider } from "./WorkflowStatesProvider.js";
import { WorkflowStateWidgetCard } from "./Card/WorkflowStatesWidgetCard.js";

interface IWorkflowStatesWidgetViewProps {
    client: ApolloClient<object>;
}


export const WorkflowStatesOwnWidgetView = (props: IWorkflowStatesWidgetViewProps) => {
    const { client } = props;

    return (
        <WorkflowStatesProvider type={"own"} client={client}>
            <WorkflowStateWidgetCard />
        </WorkflowStatesProvider>
    );
};
