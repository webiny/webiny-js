import React, { useMemo } from "react";
import { WorkflowStateListProvider } from "../Provider/index.js";
import { WorkflowStateList } from "./WorkflowStateList.js";
import type ApolloClient from "apollo-client";
import { useRoute } from "@webiny/app";
import { Routes } from "~/routes.js";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/Presenters/index.js";

interface IWorkflowStateListViewProps {
    client: ApolloClient<object>;
}

export const WorkflowStateListView = (props: IWorkflowStateListViewProps) => {
    const { client } = props;

    const { route } = useRoute(Routes.Workflows.ContentReviews);

    const where = useMemo<IWorkflowStateListPresenterListParamsWhere | undefined>(() => {
        if (!route.params.state) {
            return undefined;
        }
        return {
            state: route.params.state
        };
    }, [route.params.state]);

    return (
        <WorkflowStateListProvider client={client} type={route.params?.type} where={where}>
            <WorkflowStateList />
        </WorkflowStateListProvider>
    );
};
