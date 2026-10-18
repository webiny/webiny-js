import React from "react";
import { useFeature } from "@webiny/app";
import { WorkflowEditorMenu } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorMenu.js";
import { WorkflowEditorRoute } from "@webiny/app-workflows/editor/mounting/components/WorkflowEditorRoute.js";
import { CmsWorkflowEditorMountingFeature } from "~/features/editorMounting/feature.js";
import { Routes } from "~/routes.js";

/*
 * Mounts the shared workflow editor route and menu item with the CMS use cases and adapter. Both
 * render nothing without the workflows `editor` permission (D162).
 */
export const CmsWorkflowEditor = () => {
    const { useCases, reviewUseCases, app } = useFeature(CmsWorkflowEditorMountingFeature);

    return (
        <>
            <WorkflowEditorRoute
                route={Routes.ContentModels.Workflows}
                appBreadcrumbName="cms"
                appBreadcrumbLabel="Headless CMS"
                breadcrumbName="cms.workflows"
                useCases={useCases}
                reviewUseCases={reviewUseCases}
                app={app}
            />
            <WorkflowEditorMenu
                name="headlessCMS.contentModels.workflows"
                parent="headlessCMS"
                route={Routes.ContentModels.Workflows}
            />
        </>
    );
};
