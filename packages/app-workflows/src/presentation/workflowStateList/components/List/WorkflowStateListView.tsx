import React, { useEffect, useMemo } from "react";
import { WorkflowStateList } from "./WorkflowStateList.js";
import { useRoute } from "@webiny/app";
import { Routes } from "~/routes.js";
import type { IWorkflowStateListPresenterListParamsWhere } from "~/presentation/workflowStateList/abstractions.js";
import { useWorkflowStateListPresenter } from "~/presentation/workflowStateList/useWorkflowStateListPresenter.js";

export const WorkflowStateListView = () => {
    const { route } = useRoute(Routes.Workflows.ContentReviews);
    const presenter = useWorkflowStateListPresenter();

    const where = useMemo<IWorkflowStateListPresenterListParamsWhere | undefined>(() => {
        if (!route.params.state) {
            return undefined;
        }
        return {
            state: route.params.state
        };
    }, [route.params.state]);

    useEffect(() => {
        if (route.params?.type) {
            presenter.setType(route.params.type);
        }
        presenter.list({ where });
    }, [where, route.params?.type]);

    return <WorkflowStateList />;
};
