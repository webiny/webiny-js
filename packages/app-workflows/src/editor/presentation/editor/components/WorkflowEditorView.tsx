import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * The shared editor view the CMS and WB packages mount (Tasks 20 and 21). The per-app use cases,
 * the app's review use cases and the app adapter arrive as props and go to `presenter.init`
 * (the 8a mounting pattern).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { useCases, reviewUseCases, app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass singletons: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ useCases, reviewUseCases, app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, reviewUseCases, app]);

    return <WorkflowEditorLayout presenter={presenter} app={app} />;
});
