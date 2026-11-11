import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { AdminConfig } from "@webiny/app-admin";
import { createReactiveComponent } from "@webiny/app-admin";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    app: WorkflowEditorAppAdapter;
    // The route's breadcrumb name; the open model's crumb is registered under `<name>.model`.
    breadcrumbName: string;
}

/*
 * The shared editor view the CMS and WB packages mount. Only the app adapter arrives as a prop and
 * goes to `presenter.init`; the editor's use cases come through DI (R353).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass a singleton: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, app]);

    // A model without a workflow has no flow yet, so its name comes from the open row first.
    const { vm } = presenter;
    const activeRow = vm.panel.rows.find(row => row.active);
    const modelName = activeRow ? activeRow.name : vm.flow.modelName;

    let modelBreadcrumb: React.ReactNode = null;
    if (modelName !== "") {
        modelBreadcrumb = (
            <AdminConfig.Breadcrumb name={`${props.breadcrumbName}.model`} label={modelName} />
        );
    }

    return (
        <>
            {modelBreadcrumb}
            <WorkflowEditorLayout
                presenter={presenter}
                app={app}
                drawer={<StepDrawer source={presenter} stepId={vm.openStepId} />}
            />
        </>
    );
});
