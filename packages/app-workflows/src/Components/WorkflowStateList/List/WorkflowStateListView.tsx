import React from "react";
import { WorkflowStateListProvider } from "../Provider/index.js";
import { WorkflowStateList } from "./WorkflowStateList.js";
import type ApolloClient from "apollo-client";

interface IWorkflowStateListViewProps {
    client: ApolloClient<object>;
}

export const WorkflowStateListView = (props: IWorkflowStateListViewProps) => {
    const { client } = props;
    return (
        <WorkflowStateListProvider client={client}>
            <WorkflowStateList />
        </WorkflowStateListProvider>
    );
};
