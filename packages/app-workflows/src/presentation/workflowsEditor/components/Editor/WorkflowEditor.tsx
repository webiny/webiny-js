import React, { useEffect } from "react";
import type { IWorkflow, IWorkflowApplication, IWorkflowStep } from "~/types.js";
import type { NonEmptyArray } from "@webiny/app/types.js";
import { mdbid } from "@webiny/utils/mdbid.js";
import { useWorkflowsEditorPresenter } from "~/presentation/workflowsEditor/useWorkflowsEditorPresenter.js";
import { WorkflowEditorView } from "./WorkflowEditorView.js";

export interface IWorkflowPresenterProps {
    app: IWorkflowApplication;
}

const createDefaultWorkflow = (options: Pick<IWorkflow, "app"> & Partial<IWorkflow>): IWorkflow => {
    return {
        id: mdbid(),
        name: "Default Workflow",
        steps: [] as unknown as NonEmptyArray<IWorkflowStep>,
        ...options
    };
};

export const WorkflowEditor = (props: IWorkflowPresenterProps) => {
    const { app } = props;
    const presenter = useWorkflowsEditorPresenter();

    useEffect(() => {
        const defaultWorkflow = createDefaultWorkflow({ app: app.id });
        presenter.init({ app, defaultWorkflow });
    }, [app]);

    return <WorkflowEditorView presenter={presenter} />;
};
