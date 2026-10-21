import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    app: WorkflowEditorAppAdapter;
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

    return (
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<StepDrawer source={presenter} stepId={presenter.vm.openStepId} />}
        />
    );
});
