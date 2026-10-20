import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { StepDrawer } from "~/editor/presentation/stepDrawer/StepDrawer.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * The shared editor view the CMS and WB packages mount. The app's review use cases and the app
 * adapter arrive as props and go to `presenter.init` (the 8a mounting pattern); the editor use
 * cases come through DI and route by the adapter's `appKind` (R348, R353).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { reviewUseCases, app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass singletons: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ reviewUseCases, app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, reviewUseCases, app]);

    return (
        <WorkflowEditorLayout
            presenter={presenter}
            app={app}
            drawer={<StepDrawer source={presenter} stepId={presenter.vm.openStepId} />}
        />
    );
});
